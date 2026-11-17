# Test SimsGPT on a Samsung phone

Use the checkout containing the SimsGPT rename. Run `nvm use` and `npm ci` from the repository root.

## Prepare the Mac

Install JDK 17 and Google's Android SDK command-line tools. Android Studio is optional for a command-line build. Put the tools under `~/Library/Android/sdk/cmdline-tools/latest`. With Homebrew JDK 17 on Apple Silicon, use:

```sh
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
java -version
"$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --install \
  'platforms;android-37.0' 'build-tools;37.0.0' 'ndk;27.1.12297006' 'cmake;3.22.1' 'platform-tools'
```

The project pins these SDK versions in `android/build.gradle`. The Gradle wrapper downloads the pinned Gradle distribution. Review any SDK license prompts during installation.

## Connect and build

1. On the Samsung, open **Settings → About phone → Software information** and tap **Build number** seven times.
2. Turn on **USB debugging** under **Settings → Developer options**. Connect with a data cable, unlock the phone, and accept its USB debugging prompt.
3. Run `adb devices` and confirm the phone shows as `device`. Get its ABI with `adb shell getprop ro.product.cpu.abilist`. The command below builds the default multi-architecture APK for device testing and sharing.

```sh
(cd android && ./gradlew :app:assembleRelease --max-workers=2)
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

This test APK uses the template debug signing key. The new application ID installs alongside the earlier prototype and has its own app data and permissions.

## Verify on the phone

Open **SimsGPT** with Metro stopped. Sign in with your company Microsoft account, verify the redirect returns to SIMS, and send a message to confirm the response streams. Check Android Back navigation, keyboard, uploads, and generated downloads. Record the device and Android version alongside each test result.

## Verify the APK before sharing

Run these from the repository root after the Samsung smoke test succeeds.

```sh
apk=android/app/build/outputs/apk/release/app-release.apk
build_tools="$ANDROID_HOME/build-tools/37.0.0"
"$build_tools/aapt" dump badging "$apk" | head -n 1
"$build_tools/apksigner" verify --verbose "$apk"
shasum -a 256 "$apk"
```

Confirm the package is `com.sixtst.simsgpt` and the signature verifies. Share the APK you installed for the test and record its SHA-256 with the build commit and test results.

## Earlier prototype build

The ARM64 Release build succeeded with Gradle 9.4.1, JDK 17.0.21.0.3, and the SDK packages above. Gradle also installed Build Tools 36.0.0 for a dependency. The APK is at `android/app/build/outputs/apk/release/app-release.apk`. It is about 18 MiB, its APK signature verifies, and it contains `assets/index.android.bundle`.

SHA-256: `36e14a0a16349b7bc24a70bcd0fad14269f200af3162c53ff1e62fa7c49cd392`.

Samsung installation, launch, Microsoft sign-in, streaming, and file workflows are pending device verification.
