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
    voice: Literal["male", "female"] = "female"


class SynthesizeResponse(BaseModel):
    audioBase64: str


class GrammarExerciseRequest(BaseModel):
    topicTitle: str
    topicExplanation: str
    difficultyLevel: str = "B1"
    exerciseType: Literal["multiple_choice", "fill_blank"] = "multiple_choice"


class GrammarExerciseResponse(BaseModel):
    question: str
    options: list[str]
    correctAnswer: str
    explanation: str


class ReadingComprehensionRequest(BaseModel):
    passageContent: str
    cefrLevel: str = "B1"


class ComprehensionQuestionModel(BaseModel):
    question: str
    options: list[str]
    correctAnswer: str


class ReadingComprehensionResponse(BaseModel):
    summary: str
    vocabularyWords: list[str]
    questions: list[ComprehensionQuestionModel]
