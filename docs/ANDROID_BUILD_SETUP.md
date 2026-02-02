# 🚀 Android Build & Release Setup Guide

This guide explains how to set up automated Android APK builds using GitHub Actions.

## 📋 Prerequisites

1. A GitHub repository with your Expo/React Native project
2. An Android keystore for signing release builds (or follow the steps below to create one)

---

## 🔐 Step 1: Generate a Release Keystore

Run the following command to create a release keystore:

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias floodmap-key -keyalg RSA -keysize 2048 -validity 10000
```

You'll be prompted to:

- Enter a keystore password (remember this!)
- Enter key password (can be same as keystore password)
- Enter your name, organization, city, etc.

**⚠️ IMPORTANT: Keep your keystore file and passwords safe! You'll need them to update your app.**

---

## 🔑 Step 2: Configure GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Add the following secrets:

| Secret Name               | Description               | How to Get                                                                                         |
| ------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------- |
| `ANDROID_KEYSTORE_BASE64` | Base64 encoded keystore   | `base64 -i release.keystore` (Mac/Linux) or `certutil -encode release.keystore temp.b64` (Windows) |
| `KEYSTORE_PASSWORD`       | Password for the keystore | The password you used when creating the keystore                                                   |
| `KEY_ALIAS`               | Alias for the key         | `floodmap-key` (or whatever you used)                                                              |
| `KEY_PASSWORD`            | Password for the key      | The key password you used                                                                          |

### Encoding keystore on Windows PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("release.keystore")) | Out-File -FilePath keystore_base64.txt -Encoding ASCII
```

### Encoding keystore on Mac/Linux:

```bash
base64 -i release.keystore > keystore_base64.txt
```

Copy the contents of `keystore_base64.txt` to the `ANDROID_KEYSTORE_BASE64` secret.

---

## 🏗️ Step 3: Trigger a Build

### Option A: Manual Trigger (Recommended for first build)

1. Go to your repository → **Actions** tab
2. Select "Build & Release Android APK" workflow
3. Click "Run workflow"
4. Enter version (e.g., `1.0.0`) and release notes
5. Click "Run workflow"

### Option B: Automatic Trigger via Git Tags

```bash
git tag v1.0.0
git push origin v1.0.0
```

This will automatically trigger the build and create a release.

---

## 📦 Step 4: Download Your APK

After the build completes:

1. Go to your repository → **Releases** page
2. Find the latest release
3. Download the APK file

---

## 🔧 Workflow Configuration

The workflow is located at `.github/workflows/android-build.yml`

### Build Triggers:

- **Push tags**: Any tag starting with `v` (e.g., `v1.0.0`, `v2.1.0`)
- **Manual dispatch**: From GitHub Actions UI with custom version and notes

### What it does:

1. Sets up Node.js, Java JDK, and Android SDK
2. Installs npm dependencies
3. Runs `expo prebuild` for Android
4. Signs the APK with your release keystore
5. Creates a GitHub Release with the APK attached

---

## 🐛 Troubleshooting

### Build fails with "keystore not found"

- Make sure `ANDROID_KEYSTORE_BASE64` secret is properly set
- Verify the base64 encoding doesn't have any line breaks

### Signing fails

- Double-check `KEYSTORE_PASSWORD`, `KEY_ALIAS`, and `KEY_PASSWORD` secrets
- Ensure the key alias matches what you used when creating the keystore

### Gradle build fails

- Check the Actions log for specific error messages
- Try running `npm ci && npx expo prebuild --clean --platform android` locally first

### Release not showing up

- Make sure the workflow has `contents: write` permission
- Check that `GITHUB_TOKEN` is properly configured (should be automatic)

---

## 📝 Version Bumping

To release a new version:

1. Update version in `app.json`:

   ```json
   {
     "expo": {
       "version": "1.1.0"
     }
   }
   ```

2. Update `versionCode` in `android/app/build.gradle` (must be incremented for Play Store):

   ```gradle
   versionCode 2
   versionName "1.1.0"
   ```

3. Create and push a new tag:
   ```bash
   git add .
   git commit -m "Bump version to 1.1.0"
   git tag v1.1.0
   git push origin main v1.1.0
   ```

---

## 🚀 Future Enhancements

- Add AAB (Android App Bundle) builds for Play Store
- Add iOS builds (requires macOS runner)
- Add automated testing before build
- Add Play Store deployment via Fastlane

---

## 📚 Resources

- [React Native Signed APK](https://reactnative.dev/docs/signed-apk-android)
- [Expo Prebuild](https://docs.expo.dev/workflow/prebuild/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github)
