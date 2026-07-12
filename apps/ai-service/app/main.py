import json
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

from .model import load_model, is_model_loaded, get_model_path, get_thread_count
from .embeddings import embed_text, is_embedding_model_loaded
from .speech import (
    transcribe_audio,
    synthesize_speech,
    is_whisper_loaded,
    is_piper_loaded,
)
from .inference_lock import INFERENCE_LOCK
from .prompts import (
    build_system_prompt,
    build_grammar_explain_prompt,
    parse_grammar_explain_response,
    build_vocabulary_explain_prompt,
    parse_vocabulary_explain_response,
    build_grammar_exercise_prompt,
    parse_grammar_exercise_response,
    build_reading_comprehension_prompt,
    parse_reading_comprehension_response,
)
from .schemas import (
    ChatRequest,
    GrammarExplainRequest,
    GrammarExplainResponse,
    EmbedRequest,
    EmbedResponse,
    VocabularyExplainRequest,
    VocabularyExplainResponse,
    TranscribeRequest,
    TranscribeResponse,
    SynthesizeRequest,
    SynthesizeResponse,
    GrammarExerciseRequest,
    GrammarExerciseResponse,
    ReadingComprehensionRequest,
    ReadingComprehensionResponse,
)

app = FastAPI(title="English Class AI Service")


@app.on_event("startup")
def _startup() -> None:
    load_model()


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "modelLoaded": is_model_loaded(),
        "embeddingModelLoaded": is_embedding_model_loaded(),
        "whisperLoaded": is_whisper_loaded(),
        "piperLoaded": is_piper_loaded(),
        "modelPath": get_model_path(),
        "threadCount": get_thread_count(),
    }


def _stream_chat(request: ChatRequest):
    system_prompt = build_system_prompt(request.scenario, request.difficultyLevel)
    messages = [{"role": "system", "content": system_prompt}] + [
        {"role": m.role, "content": m.content} for m in request.messages
    ]

    full_text = ""
    with INFERENCE_LOCK:
        llm = load_model()
        for chunk in llm.create_chat_completion(
            messages=messages,
            max_tokens=400,
            stream=True,
        ):
            delta = chunk["choices"][0].get("delta", {})
            token = delta.get("content")
            if token:
                full_text += token
                yield json.dumps({"token": token}) + "\n"

    yield json.dumps({"done": True, "fullText": full_text}) + "\n"


@app.post("/v1/chat")
def chat(request: ChatRequest) -> StreamingResponse:
    return StreamingResponse(
        _stream_chat(request),
        media_type="application/x-ndjson",
    )


@app.post("/v1/grammar/explain")
def grammar_explain(request: GrammarExplainRequest) -> GrammarExplainResponse:
    messages = build_grammar_explain_prompt(
        request.originalText,
        request.correctedText,
        request.ruleDescription,
        request.difficultyLevel,
    )

    with INFERENCE_LOCK:
        llm = load_model()
        result = llm.create_chat_completion(messages=messages, max_tokens=250)

    raw_text = result["choices"][0]["message"]["content"]
    explanation, example = parse_grammar_explain_response(raw_text)

    return GrammarExplainResponse(explanation=explanation, example=example)


@app.post("/v1/embed")
def embed(request: EmbedRequest) -> EmbedResponse:
    with INFERENCE_LOCK:
        embedding = embed_text(request.text)
    return EmbedResponse(embedding=embedding)


@app.post("/v1/vocabulary/explain")
def vocabulary_explain(request: VocabularyExplainRequest) -> VocabularyExplainResponse:
    messages = build_vocabulary_explain_prompt(request.word, request.difficultyLevel)

    with INFERENCE_LOCK:
        llm = load_model()
        result = llm.create_chat_completion(messages=messages, max_tokens=200)

    raw_text = result["choices"][0]["message"]["content"]
    parsed = parse_vocabulary_explain_response(raw_text)

    return VocabularyExplainResponse(**parsed)


@app.post("/v1/grammar/exercise")
def grammar_exercise(request: GrammarExerciseRequest) -> GrammarExerciseResponse:
    messages = build_grammar_exercise_prompt(
        request.topicTitle,
        request.topicExplanation,
        request.difficultyLevel,
        request.exerciseType,
    )

    with INFERENCE_LOCK:
        llm = load_model()
        result = llm.create_chat_completion(messages=messages, max_tokens=200)

    raw_text = result["choices"][0]["message"]["content"]
    parsed = parse_grammar_exercise_response(raw_text, request.exerciseType)

    return GrammarExerciseResponse(**parsed)


@app.post("/v1/reading/comprehension")
def reading_comprehension(request: ReadingComprehensionRequest) -> ReadingComprehensionResponse:
    messages = build_reading_comprehension_prompt(request.passageContent, request.cefrLevel)

    with INFERENCE_LOCK:
        llm = load_model()
        result = llm.create_chat_completion(messages=messages, max_tokens=700)

    raw_text = result["choices"][0]["message"]["content"]
    parsed = parse_reading_comprehension_response(raw_text)

    return ReadingComprehensionResponse(**parsed)


@app.post("/v1/speech/transcribe")
def speech_transcribe(request: TranscribeRequest) -> TranscribeResponse:
    with INFERENCE_LOCK:
        transcript = transcribe_audio(request.audioBase64)
    return TranscribeResponse(transcript=transcript)


@app.post("/v1/speech/synthesize")
def speech_synthesize(request: SynthesizeRequest) -> SynthesizeResponse:
    with INFERENCE_LOCK:
        audio_base64 = synthesize_speech(request.text, request.voice)
    return SynthesizeResponse(audioBase64=audio_base64)
