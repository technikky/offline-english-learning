from typing import Literal
from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    scenario: str = "free_talk"
    difficultyLevel: str = "B1"


class GrammarExplainRequest(BaseModel):
    originalText: str
    correctedText: str
    ruleDescription: str
    difficultyLevel: str = "B1"


class GrammarExplainResponse(BaseModel):
    explanation: str
    example: str


class EmbedRequest(BaseModel):
    text: str


class EmbedResponse(BaseModel):
    embedding: list[float]


class VocabularyExplainRequest(BaseModel):
    word: str
    difficultyLevel: str = "B1"


class VocabularyExplainResponse(BaseModel):
    definition: str
    example: str
    synonyms: list[str]
    antonyms: list[str]
    cefrLevel: str


class TranscribeRequest(BaseModel):
    audioBase64: str


class TranscribeResponse(BaseModel):
    transcript: str


class SynthesizeRequest(BaseModel):
    text: str


class SynthesizeResponse(BaseModel):
    audioBase64: str
