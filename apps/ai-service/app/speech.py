import os
import io
import base64
import tempfile
import wave

import numpy as np
from pywhispercpp.model import Model as WhisperModel
from piper import PiperVoice

from .tone import compare_contours, extract_pitch_contour

WHISPER_SAMPLE_RATE = 16000

WHISPER_MODELS_DIR = os.path.join(
    os.path.dirname(__file__), "..", "..", "..", "offline-sdk", "ai-models", "whisper-models"
)
_PIPER_VOICES_DIR = os.path.join(
    os.path.dirname(__file__), "..", "..", "..", "offline-sdk", "ai-models", "piper-voices"
)

# Stage 16: two vendored voices so the conversation avatar can speak male or
# female. The female (lessac) voice is the default, preserving the original
# single-voice behavior for callers that don't specify a gender.
PIPER_VOICE_PATH = os.path.join(_PIPER_VOICES_DIR, "en_US-lessac-medium.onnx")
PIPER_VOICE_PATH_MALE = os.path.join(_PIPER_VOICES_DIR, "en_US-ryan-medium.onnx")
# Stage 29: the vendored Mandarin voice. Only one Chinese voice is bundled, so
# Chinese speech doesn't vary by avatar gender.
PIPER_VOICE_PATH_CHINESE = os.path.join(_PIPER_VOICES_DIR, "zh_CN-huayan-medium.onnx")

# Stage 29: Whisper model per target language. English keeps the small, fast
# English-only `tiny.en` it has always used; Chinese needs a *multilingual*
# model (`small`), which is far larger, so it is only loaded if someone
# actually speaks Chinese. Both are cached separately and lazily.
WHISPER_MODEL_BY_LANGUAGE = {
    "english": os.environ.get("WHISPER_MODEL", "tiny.en"),
    "chinese": os.environ.get("WHISPER_MODEL_MULTILINGUAL", "small"),
}

_whisper_models: dict[str, WhisperModel] = {}
# One lazily-loaded PiperVoice per cache key, so we don't reload a ~60MB model
# on every request (they fit comfortably in memory alongside the LLM).
_piper_voices: dict[str, PiperVoice] = {}


def _normalize_language(language: str | None) -> str:
    return "chinese" if language == "chinese" else "english"


def _get_whisper_model_name(language: str = "english") -> str:
    return WHISPER_MODEL_BY_LANGUAGE[_normalize_language(language)]


def _get_piper_voice_path(voice: str = "female", language: str = "english") -> str:
    if _normalize_language(language) == "chinese":
        return os.environ.get("PIPER_VOICE_PATH_CHINESE", PIPER_VOICE_PATH_CHINESE)
    if voice == "male":
        return os.environ.get("PIPER_VOICE_PATH_MALE", PIPER_VOICE_PATH_MALE)
    return os.environ.get("PIPER_VOICE_PATH", PIPER_VOICE_PATH)


def load_whisper_model(language: str = "english") -> WhisperModel:
    normalized = _normalize_language(language)
    if normalized not in _whisper_models:
        os.makedirs(WHISPER_MODELS_DIR, exist_ok=True)
        if normalized == "chinese":
            # Pin the decode language so the multilingual model doesn't
            # mis-detect short utterances as another language.
            _whisper_models[normalized] = WhisperModel(
                _get_whisper_model_name("chinese"),
                models_dir=WHISPER_MODELS_DIR,
                language="zh",
            )
        else:
            # Constructed exactly as before, so English behaviour is unchanged.
            _whisper_models[normalized] = WhisperModel(
                _get_whisper_model_name("english"), models_dir=WHISPER_MODELS_DIR
            )
    return _whisper_models[normalized]


def load_piper_voice(voice: str = "female", language: str = "english") -> PiperVoice:
    normalized_voice = "male" if voice == "male" else "female"
    normalized_language = _normalize_language(language)
    # Chinese has a single vendored voice, so gender is not part of its key.
    key = "chinese" if normalized_language == "chinese" else normalized_voice
    if key not in _piper_voices:
        _piper_voices[key] = PiperVoice.load(
            _get_piper_voice_path(normalized_voice, normalized_language)
        )
    return _piper_voices[key]


def is_whisper_loaded() -> bool:
    return len(_whisper_models) > 0


def is_piper_loaded() -> bool:
    return len(_piper_voices) > 0


def _read_wav_as_float32(wav_path: str) -> np.ndarray:
    """Reads a WAV file (any sample rate, mono or stereo, 16-bit PCM) and
    returns mono float32 samples at Whisper's required 16kHz.

    Browser recording APIs (MediaRecorder + Web Audio API on the desktop
    client) can't be relied on to produce exactly-16kHz WAV output, so the
    server resamples rather than rejecting anything that isn't already the
    right rate — pywhispercpp's own loader does the latter (see
    docs/12-stage9-plan.md's note on this discovered during development)."""
    with wave.open(wav_path, "rb") as wav_file:
        rate = wav_file.getframerate()
        channels = wav_file.getnchannels()
        frames = wav_file.readframes(wav_file.getnframes())

    samples = np.frombuffer(frames, dtype=np.int16).astype(np.float32)
    if channels > 1:
        samples = samples.reshape(-1, channels).mean(axis=1)

    if rate != WHISPER_SAMPLE_RATE:
        duration = len(samples) / rate
        new_length = int(duration * WHISPER_SAMPLE_RATE)
        samples = np.interp(
            np.linspace(0, len(samples), new_length, endpoint=False),
            np.arange(len(samples)),
            samples,
        )

    # whisper.cpp expects float32 PCM normalized to [-1, 1].
    return (samples / 32768.0).astype(np.float32)


def transcribe_audio(audio_base64: str, language: str = "english") -> str:
    model = load_whisper_model(language)
    audio_bytes = base64.b64decode(audio_base64)

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        samples = _read_wav_as_float32(tmp_path)
        segments = model.transcribe(samples)
        return " ".join(segment.text.strip() for segment in segments).strip()
    finally:
        os.unlink(tmp_path)


def _decode_wav_base64(audio_base64: str) -> np.ndarray:
    """Base64 WAV -> mono float32 samples at WHISPER_SAMPLE_RATE."""
    audio_bytes = base64.b64decode(audio_base64)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name
    try:
        return _read_wav_as_float32(tmp_path)
    finally:
        os.unlink(tmp_path)


# Reference pitch contours, keyed by target phrase. Piper synthesis is not
# bit-identical between runs, so re-synthesizing the reference on every attempt
# would make the same recording score differently each time -- unacceptable for
# feedback a student is meant to act on. Caching also skips a ~1s synthesis per
# attempt. Bounded so a long-running server can't grow it without limit.
_reference_contours: dict[str, np.ndarray] = {}
_REFERENCE_CACHE_LIMIT = 256


def _reference_contour(target_text: str) -> np.ndarray:
    key = target_text.strip()
    cached = _reference_contours.get(key)
    if cached is not None:
        return cached

    reference_base64 = synthesize_speech(target_text, "female", "chinese")
    contour = extract_pitch_contour(
        _decode_wav_base64(reference_base64), WHISPER_SAMPLE_RATE
    )
    if len(_reference_contours) >= _REFERENCE_CACHE_LIMIT:
        _reference_contours.clear()
    _reference_contours[key] = contour
    return contour


def score_tone(audio_base64: str, target_text: str) -> dict:
    """Stage 30: scores Mandarin tones from pitch, not from the transcript.

    The reference contour comes from synthesizing the same phrase with the
    vendored Mandarin voice, so no extra model or annotated tone data is needed
    — the TTS voice we already ship *is* the native model to imitate.
    """
    learner_contour = extract_pitch_contour(
        _decode_wav_base64(audio_base64), WHISPER_SAMPLE_RATE
    )
    return compare_contours(learner_contour, _reference_contour(target_text))


def synthesize_speech(text: str, voice: str = "female", language: str = "english") -> str:
    piper_voice = load_piper_voice(voice, language)
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav_file:
        piper_voice.synthesize_wav(text, wav_file)
    return base64.b64encode(buffer.getvalue()).decode("ascii")
