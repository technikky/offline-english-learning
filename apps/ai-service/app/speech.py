import os
import io
import base64
import tempfile
import wave

import numpy as np
from pywhispercpp.model import Model as WhisperModel
from piper import PiperVoice

WHISPER_SAMPLE_RATE = 16000

WHISPER_MODELS_DIR = os.path.join(
    os.path.dirname(__file__), "..", "..", "..", "offline-sdk", "ai-models", "whisper-models"
)
PIPER_VOICE_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "..",
    "..",
    "offline-sdk",
    "ai-models",
    "piper-voices",
    "en_US-lessac-medium.onnx",
)

_whisper_model: WhisperModel | None = None
_piper_voice: PiperVoice | None = None


def _get_whisper_model_name() -> str:
    return os.environ.get("WHISPER_MODEL", "tiny.en")


def _get_piper_voice_path() -> str:
    return os.environ.get("PIPER_VOICE_PATH", PIPER_VOICE_PATH)


def load_whisper_model() -> WhisperModel:
    global _whisper_model
    if _whisper_model is None:
        os.makedirs(WHISPER_MODELS_DIR, exist_ok=True)
        _whisper_model = WhisperModel(
            _get_whisper_model_name(), models_dir=WHISPER_MODELS_DIR
        )
    return _whisper_model


def load_piper_voice() -> PiperVoice:
    global _piper_voice
    if _piper_voice is None:
        _piper_voice = PiperVoice.load(_get_piper_voice_path())
    return _piper_voice


def is_whisper_loaded() -> bool:
    return _whisper_model is not None


def is_piper_loaded() -> bool:
    return _piper_voice is not None


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


def transcribe_audio(audio_base64: str) -> str:
    model = load_whisper_model()
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


def synthesize_speech(text: str) -> str:
    voice = load_piper_voice()
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav_file:
        voice.synthesize_wav(text, wav_file)
    return base64.b64encode(buffer.getvalue()).decode("ascii")
