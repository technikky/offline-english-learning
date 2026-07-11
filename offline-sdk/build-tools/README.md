# offline-sdk/build-tools

Vendored content: Flutter SDK, Android SDK/NDK, Java (for LanguageTool in Stage 5), per [docs/03-roadmap.md](../../docs/03-roadmap.md).

## Important: install these tools at a path with no spaces

Android's `cmdline-tools` (`sdkmanager.bat`, and the Gradle wrapper used to build the app) break when installed under a path containing spaces. This repo's own path (`.../need tools/englishclass`) contains one, so **do not** vendor `flutter/` or `android-sdk/` directly inside this folder on Windows.

On the current development machine these are installed instead at:

- Flutter SDK: `D:\dev-sdks\flutter`
- Android SDK (platform-tools, `platforms;android-34`, `build-tools;34.0.0`): `D:\dev-sdks\android-sdk`

Both configured via:

```
flutter config --android-sdk "D:\dev-sdks\android-sdk"
```

`flutter doctor` confirms `[√] Android toolchain`. Analytics/telemetry disabled via `flutter config --no-analytics` and `flutter --disable-analytics`, matching this project's no-telemetry stance (see [docs/01-architecture.md](../../docs/01-architecture.md) §7).

## For a genuinely offline school install

The vendoring/restore script (Stage 10 deliverable, same as `offline-sdk/node/README.md`) should install Flutter and the Android SDK to a fixed, space-free path outside the repo (e.g. `C:\englishclass-sdks\` on a school server) rather than inside `offline-sdk/`, for the same reason. This folder documents *that* the tools are needed and exactly which versions/components, not literal binaries.

## LanguageTool (Stage 5)

Unlike Flutter/Android, LanguageTool is pure Java and has no problem with spaces in its own install path, so it's vendored directly at `offline-sdk/build-tools/LanguageTool-6.5/` (gitignored — ~700MB unpacked, restored the same way as the other large vendored tools, not committed as a blob).

Run the server:

```
java -cp offline-sdk/build-tools/LanguageTool-6.5/languagetool-server.jar org.languagetool.server.HTTPServer --port 8081
```

`GET/POST http://127.0.0.1:8081/v2/check?language=en-US&text=...` — see [docs/08-stage5-plan.md](../../docs/08-stage5-plan.md).

## Versions pinned for this project

- Flutter: `3.27.1` (stable channel) — Stage 2
- Android SDK Platform: `android-34`, Build-Tools: `34.0.0` — Stage 2
- Java: JDK 18.0.2.1 (existing system install, used as `JAVA_HOME` for both the Android toolchain and LanguageTool)
- LanguageTool: `6.5` — Stage 5
