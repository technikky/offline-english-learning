from typing import Literal
from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    scenario: str = "free_talk"
    difficultyLevel: str = "B1"
    customPrompt: str | None = None  # Stage 23: teacher-authored topic prompt
    # Stage 28: which language the student is learning. Defaults to English so
    # existing callers are unaffected.
    targetLanguage: Literal["english", "chinese"] = "english"


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
    # Stage 29: picks the Whisper model + decode language (English keeps the
    # fast English-only tiny.en; Chinese uses the multilingual model).
    targetLanguage: Literal["english", "chinese"] = "english"


class TranscribeResponse(BaseModel):
    transcript: str


class SynthesizeRequest(BaseModel):
    text: str
    voice: Literal["male", "female"] = "female"
    # Stage 29: selects the Piper voice; Chinese uses the vendored Mandarin
    # voice, for which the male/female choice does not apply.
    targetLanguage: Literal["english", "chinese"] = "english"


class SynthesizeResponse(BaseModel):
    audioBase64: str


# Stage 30: Mandarin tone scoring from the pitch contour.
class ToneScoreRequest(BaseModel):
    audioBase64: str
    targetText: str


class ToneScoreResponse(BaseModel):
    toneScore: int
    # False when there wasn't enough voiced audio to judge -- distinguishes a
    # recording problem from an actual tone mistake.
    confident: bool
    learnerVoicedFrames: int
    referenceVoicedFrames: int
    meanSemitoneDistance: float
    feedback: str


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


class WritingAnalysisRequest(BaseModel):
    # Stage 31: Chinese writing gets Chinese-specific feedback criteria.
    targetLanguage: Literal["english", "chinese"] = "english"
    prompt: str
    studentText: str
    difficultyLevel: str = "B1"


class WritingAnalysisResponse(BaseModel):
    overall: str
    grammarScore: int
    vocabularyScore: int
    coherenceScore: int
    strengths: list[str]
    improvements: list[str]
    modelAnswer: str


class QuizGenerateRequest(BaseModel):
    # Stage 31: quiz categories and question language follow the learner.
    targetLanguage: Literal["english", "chinese"] = "english"
    category: str = "grammar"
    difficultyLevel: str = "B1"


class QuizQuestionModel(BaseModel):
    type: str
    question: str
    options: list[str]
    correctAnswer: str
    explanation: str


class QuizGenerateResponse(BaseModel):
    questions: list[QuizQuestionModel]
