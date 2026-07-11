import json
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

from .model import load_model, is_model_loaded
from .prompts import build_system_prompt
from .schemas import ChatRequest

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
