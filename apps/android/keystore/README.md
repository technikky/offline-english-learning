# Release signing keystore

This folder holds the Android release-signing keystore (`.keystore`, gitignored — never committed). This is a **school/dev-deployment signing key, not a Play Store distribution key** — there is no Play Store distribution (Stage 2 established sideloaded APKs as the distribution model). Its purpose is purely Android's own requirement that app updates be signed consistently: without one, installing an updated APK over an existing debug-signed install fails with an `INSTALL_FAILED_UPDATE_INCOMPATIBLE` error unless the old one is uninstalled first.

## Generating the keystore (already done for this dev machine)

```bash
keytool -genkeypair -v \
  -keystore apps/android/keystore/englishclass-release.keystore \
  -alias englishclass \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass <password> -keypass <password> \
  -dname "CN=Offline English Learning, OU=School Deployment, O=EnglishClass, L=Unknown, ST=Unknown, C=US"
```

`keytool` ships with any JDK — the one already vendored for LanguageTool (Stage 5) works fine.

## Wiring it into the build

Create `apps/android/android/key.properties` (gitignored) with:

```properties
storePassword=<password>
keyPassword=<password>
keyAlias=englishclass
storeFile=../keystore/englishclass-release.keystore
```

`apps/android/android/app/build.gradle` reads this file if present and signs release builds with it; if the file is missing (e.g. a fresh clone before this setup step), it falls back to the debug key so `flutter build apk --release` still works — just not update-compatible with a properly-signed install.

## Building and verifying a signed release APK

```bash
flutter build apk --release
apksigner verify --print-certs build/app/outputs/flutter-apk/app-release.apk
```

`apksigner` ships with the Android SDK build-tools already vendored in Stage 2 (`D:\dev-sdks\android-sdk\build-tools\34.0.0\apksigner.bat` on the dev machine).

## For a real school deployment

Each school (or district, if centrally managing devices) should generate its **own** keystore rather than reusing this dev one, and keep it backed up securely — losing it means future app updates can never be installed over existing ones without uninstalling first. This is documented here as the process to follow, not a key meant to be shared across deployments.
