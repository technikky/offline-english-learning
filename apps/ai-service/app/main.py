import json
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

from .model import load_model, is_model_loaded
from .prompts import (
    build_system_prompt,
    build_grammar_explain_prompt,
    parse_grammar_explain_response,
)
from .schemas import ChatRequest, GrammarExplainRequest, GrammarExplainResponse

app = FastAPI(title="English Class AI Service")


@app.on_event("startup")
def _startup() -> None:
    load_model()


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "modelLoaded": is_model_loaded()}


def _stream_chat(request: ChatRequest):
    llm = load_model()
    system_prompt = build_system_prompt(request.scenario, request.difficultyLevel)
    messages = [{"role": "system", "content": system_prompt}] + [
        {"role": m.role, "content": m.content} for m in request.messages
    ]

    full_text = ""
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
    llm = load_model()
    messages = build_grammar_explain_prompt(
        request.originalText,
        request.correctedText,
        request.ruleDescription,
        request.difficultyLevel,
    )

    result = llm.create_chat_completion(messages=messages, max_tokens=250)
    raw_text = result["choices"][0]["message"]["content"]
    explanation, example = parse_grammar_explain_response(raw_text)

    return GrammarExplainResponse(explanation=explanation, example=example)
