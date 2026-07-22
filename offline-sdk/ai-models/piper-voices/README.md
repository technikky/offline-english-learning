# Piper TTS voices (vendored, gitignored)

The `.onnx`/`.onnx.json` voice files here are large binaries, gitignored (see
the repo `.gitignore`), and restored by downloading them rather than committed.

Two voices are vendored so the conversation avatar feature (Stage 16) can offer
a male and a female AI voice:

| File | Speaker | Gender | Used for |
|---|---|---|---|
| `en_US-lessac-medium.onnx` | lessac | female | default voice; pronunciation practice; female avatar |
| `en_US-ryan-medium.onnx` | ryan | male | male avatar |
| `zh_CN-huayan-medium.onnx` | huayan | female | **Stage 29**: all Mandarin Chinese speech (listening clips, pronunciation playback) |

All are medium quality, 22050 Hz. The two `en_US` voices back the male/female
avatar choice; Chinese has a single vendored voice, so the avatar gender does
not change Chinese speech.

## Restoring (fully offline install: copy these files from the offline package)

If you need to re-download them (they come from the public Piper voices
repository on Hugging Face):

```
BASE=https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US

curl -L -o en_US-lessac-medium.onnx       "$BASE/lessac/medium/en_US-lessac-medium.onnx"
curl -L -o en_US-lessac-medium.onnx.json  "$BASE/lessac/medium/en_US-lessac-medium.onnx.json"
curl -L -o en_US-ryan-medium.onnx         "$BASE/ryan/medium/en_US-ryan-medium.onnx"
curl -L -o en_US-ryan-medium.onnx.json    "$BASE/ryan/medium/en_US-ryan-medium.onnx.json"

# Stage 29: Mandarin Chinese voice (note the different zh path)
ZH=https://huggingface.co/rhasspy/piper-voices/resolve/main/zh/zh_CN
curl -L -o zh_CN-huayan-medium.onnx      "$ZH/huayan/medium/zh_CN-huayan-medium.onnx"
curl -L -o zh_CN-huayan-medium.onnx.json "$ZH/huayan/medium/zh_CN-huayan-medium.onnx.json"
```

Each `.onnx` is ~60 MB. The AI service resolves them via the paths in
`apps/ai-service/app/speech.py` (`PIPER_VOICE_PATHS`), overridable per-gender
with the `PIPER_VOICE_PATH` (female/default), `PIPER_VOICE_PATH_MALE` and
`PIPER_VOICE_PATH_CHINESE` env vars.
