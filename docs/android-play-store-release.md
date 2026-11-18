# Android release build for Google Play (testing tracks)

Google Play expects a **signed Android App Bundle (`.aab`)**, not an APK, for new apps and most updates. Use **Internal testing**, **Closed testing**, or **Open testing** in Play Console after the artifact uploads.

## 1. One-time: create an upload keystore

Keep this file and passwords in a secure store (password manager, company vault). **Loss of the upload key** complicates updates unless you use Play Console key reset.

From the repository root on Windows (JDK on `PATH`, or Android Studio JBR):

```powershell
$keytool = "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe"
& $keytool -genkeypair -v -storetype PKCS12 `
  -keystore android\upload-keystore.jks `
  -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

Create `android/keystore.properties` from `android/keystore.properties.example` and point `storeFile` at `upload-keystore.jks` (path is relative to the `android/` folder).

```properties
storeFile=upload-keystore.jks
storePassword=your-store-password
keyAlias=upload
keyPassword=your-key-password
```

`upload-keystore.jks` and `keystore.properties` are gitignored.

## 2. Bump version for each Play upload

In `android/app/build.gradle`, increase **`versionCode`** (integer, must go up every upload) and set **`versionName`** for testers:

```gradle
versionCode 2
versionName "1.0.1"
```

## 3. Build the bundle

Prerequisites: Node **≥ 22.11**, `npm ci`, Android SDK/NDK per `android/build.gradle`, and `org.gradle.java.home` in `android/gradle.properties` (JDK 17–21).

### Windows: keep the checkout path short

With **New Architecture** enabled (`newArchEnabled=true`), native CMake builds often fail when the repo path is long (for example under `C:\Neel Shah\ApprealGroup\...`) with **“Filename longer than 260 characters”**, even if Windows long paths are turned on.

Use one of these before `bundleRelease`:

1. **Recommended:** clone or copy the repo to a short path such as `C:\SimsApp`, then build there.
2. Build on **macOS/Linux** (your team already produced release APKs from Mac; the same Gradle task applies: `./gradlew :app:bundleRelease`).
3. Only if you accept disabling Fabric/TurboModules for that build: set `newArchEnabled=false` in `android/gradle.properties`, run `cd android && gradlew.bat clean`, then bundle again (not the default for this project).

```powershell
npm run android:bundle
```

Output:

`android/app/build/outputs/bundle/release/app-release.aab`

Release builds use the upload keystore when `keystore.properties` exists. Without it, Gradle still signs with the **debug** key; **Play Console rejects debug-signed bundles** for distribution.

## 4. Upload to a testing track

1. [Google Play Console](https://play.google.com/console) → your app (create the app with package name **`com.sixtst.simsgpt`** if needed).
2. Complete required setup: store listing basics, content rating, target audience, data safety, and privacy policy URL (as required for your organization).
3. **Release** → **Testing** → choose **Internal testing** (fastest, up to 100 testers) or **Closed** / **Open** testing.
4. **Create new release** → upload `app-release.aab` → add release notes → review and roll out.

On first upload, enroll in **Play App Signing** when prompted (recommended). Google holds the app signing key; you keep the upload keystore for future uploads.

## 5. Add testers

- **Internal**: Play Console → Internal testing → Testers → email lists or Google Groups.
- Testers open the **opt-in link** from Console and install from Play Store.

## 6. Optional: verify the bundle locally

With Android SDK Build Tools 37.x:

```powershell
$bundletool = "path\to\bundletool-all.jar"
java -jar $bundletool validate --bundle android\app\build\outputs\bundle\release\app-release.aab
```

## Checklist before sharing with testers

- [ ] `keystore.properties` present; not debug-signed
- [ ] `versionCode` incremented
- [ ] Smoke test: sign-in, chat stream, permissions (camera/files if used)
- [ ] Record commit SHA and `versionName` with the release in your test notes