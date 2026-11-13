# SIMS Mobile — iOS prototype

A separate React Native Community CLI application opening **https://simsgpt.6tst.com/chat** in a WebView. The SIMS website and backend remain unchanged. Android builds, APK/AAB files, TestFlight, store submission, and final branding are deferred.

**Current status: implementation in progress.** The pinned React Native starter and iOS workspace have been created. Native compilation is in progress; signed installation and real company login/chat are not yet verified. Build commands remain planned until their actual results are recorded below.

## 1. Completed preparation

Verified on 13 November 2026:

- Xcode **27.2 (27B52)**, selected at `/Applications/Xcode.app/Contents/Developer`; first-launch check passed; iOS **27.2 SDK** available.
- NVM Node **24.22.3**, npm **11.19.1**. Download checksum passed; NVM default updated.
- Separate Homebrew Ruby **3.4.12**, Bundler **4.0.23**; system Ruby retained.
- CocoaPods **1.15.2**, xcodeproj **1.25.1**, resolved from the React Native 0.88.1 template Gemfile. Dependency and executable checks passed.
- Watchman **2026.10.26.00**, executable verified.
- iPhone **15**, iOS **26.5**, paired and connected by cable, Developer Mode enabled at the last check.
- Approximately **19 GiB** available at the last check; recheck before building.
- Separate repository beside `simsGPT`, with README-only first commit `e879e89` pushed to https://github.com/eternalbasic1/SimsApp on `main`. Later documentation/toolchain changes are local until committed and pushed.

Shell setup adds Ruby/gem executables to PATH and selects NVM's default Node. Homebrew installed/upgraded dependencies, including Python 3.15 as its `python3`. Installing Watchman temporarily unlinked the existing `thrift` command and restored it afterward. See [toolchain notes](toolchain/SETUP.md) and the prepared Gemfile/lockfile.

**Still unverified:** signing, native build compatibility, company login, streaming, file workflows, and a bundled Release launch without Metro.

## 2. Target versions and identity

- React Native **0.88.1**, React **19.3.0**, Community CLI **20.2.0**.
- `react-native-webview` **17.1.0**; matching template TypeScript, Babel, Metro, Jest, and safe-area dependencies. Record exact installed versions in lockfiles.
- Native project/scheme **SimsMobile**; display name **SIMS**; temporary bundle identifier **com.vineethreddy.simsmobile.dev**; starter artwork.
- Public SIMS URL in TypeScript configuration. No `.env`, native token bridge, injected JavaScript, or new authentication/backend APIs.
- Shared application code stays suitable for Android; its toolchain and deliverables are a later milestone.

## 3. Prerequisites and clean-Mac installation

Required: macOS, Git, Xcode with iOS support, Homebrew, NVM, Node, maintained Ruby, Bundler, Watchman, a physical iPhone/data cable, internet, an Apple account for signing, and an authorized company SIMS account.

Install Xcode from Apple and open it once to accept the license and finish setup. Install Homebrew using https://brew.sh and NVM using https://github.com/nvm-sh/nvm. Then:

```sh
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
xcodebuild -version
xcodebuild -showsdks
xcodebuild -checkFirstLaunchStatus

# With NVM installed and loaded:
nvm install 24.22.3
nvm alias default 24.22.3
nvm use 24.22.3

brew install ruby@3.4 watchman
export PATH="/opt/homebrew/opt/ruby@3.4/bin:/opt/homebrew/lib/ruby/gems/3.4.0/bin:$PATH"
gem install bundler -v 4.0.23 --no-document

node --version
npm --version
ruby --version
bundle --version
watchman --version
df -h /
```

The Ruby PATH above is for Apple Silicon. On Intel, use `brew --prefix ruby@3.4` and `gem env` to determine the paths. Persist the correct PATH in your shell startup file. Homebrew patch versions may change; compare actual versions to the tested baseline. Use Bundler and the committed lockfile for CocoaPods rather than an unrelated global install.

Initially skip simulator runtimes. Cancel unused simulator downloads; the iOS SDK listing does not mean a simulator runtime is installed or required.

The prepared Gemfile constrains xcodeproj below 1.26.0. Actual compatibility with Xcode 27.2 remains a starter-build gate. Diagnose a concrete failure before changing constraints; record any necessary adjustment and updated lockfile.

## 4. Prepare the iPhone and signing

1. Connect the unlocked phone with a data-capable cable.
2. Select the phone under Finder → Locations and accept Trust prompts on the Mac and phone.
3. In Xcode 27 use **Xcode → Open Developer Tool → Device Hub**. The old Window → Devices and Simulators instructions do not apply. Do not create a simulator for this milestone.
4. Enable Settings → Privacy & Security → Developer Mode if requested; complete its restart/confirmation. It was already enabled at the last check.
5. Initial wireless pairing needs iOS 27 or later; the current iOS 26.5 phone uses a cable.
6. Recheck before building:

```sh
xcrun devicectl list devices
xcrun devicectl device info details --device YOUR_IPHONE_UDID
```

Replace `YOUR_IPHONE_UDID` with the identifier from the list. Confirm paired/connected and Developer Mode enabled. The user enters all passwords, passcodes, and Apple/company credentials.

After app creation, add/select your account under Xcode Settings → Apple Accounts. Open the application target's Signing & Capabilities, enable automatic signing, choose your team, and use `com.vineethreddy.simsmobile.dev`. A free Apple account is sufficient for initial personal-device development, subject to Apple's provisioning limits. It does not provide general team distribution; periodic rebuilding/re-signing may be necessary.

## 5. Implementation order

1. Preserve this repository's Git history, README, and toolchain records. Generate a pinned SimsMobile starter in a temporary folder, then merge its files here without replacing `.git` or nesting another repository.
2. Migrate the prepared Gemfile/lockfile to the app root; add Node/Ruby version files, npm lockfile, and ignores. Retain matching template configuration.
3. Install dependencies, configure identity/signing, and run the **untouched starter UI on the phone** before adding WebView code. Diagnose any toolchain failure first.
4. Implement the hosted WebView with safe areas, initial loading indicator, clear main-page error and Retry, persistent normal storage, and terminated-content-process recovery.
5. Test Microsoft login first. Observe real redirects before finalizing navigation handling; keep legitimate authentication redirects inside the WebView.
6. Test chat, lifecycle, navigation, and files. Record honest results, including failed blob downloads.
7. Run automated checks and a bundled Release build with Metro stopped and the Mac disconnected.
8. Update this README with actual changes, executed commands, resolved versions, test results, and remaining issues.

See [the detailed iOS implementation plan](docs/ios-implementation-plan.md). This documentation does not itself start app implementation.

## 6. Clone and install dependencies after scaffolding

These commands become usable once the actual app files exist:

```sh
git clone https://github.com/eternalbasic1/SimsApp.git
cd SimsApp
nvm use
npm ci
bundle config set --local path vendor/bundle
bundle install
cd ios
bundle exec pod install
cd ..
```

Use the existing checkout instead of cloning when appropriate. Before scaffolding, the Ruby bundle can already be checked from `toolchain/`; afterward its Gemfile and lockfile belong at the app root. Commit `package-lock.json`, `Gemfile.lock`, and `ios/Podfile.lock`. Ignore dependencies, Pods, caches, build products, local paths, and signing material.

After project creation, configure the local Xcode Node executable from the app root:

```sh
nvm use
printf 'export NODE_BINARY="%s"\n' "$(command -v node)" > ios/.xcode.env.local
```

Keep this machine-specific file ignored. Recreate it after changing Node's installed path. The NVM-managed absolute executable was checked in an empty shell environment; an actual Xcode build is still required.

## 7. Run a development build

1. After installing Pods, open `ios/SimsMobile.xcworkspace` in Xcode, rather than the `.xcodeproj`.
2. Complete account/team and automatic-signing setup above.
3. Select the SimsMobile scheme in Debug configuration and your physical iPhone as the destination.
4. From the app root, start Metro in Terminal:

```sh
npm start
```

5. Press Run in Xcode and handle device trust/developer-app prompts.
6. Verify the starter screen first; after integration, verify the SIMS screen.

If Debug cannot reach Metro, inspect the Mac/phone network, local-network permission, firewall, and Metro address. Debug development normally uses Metro; Release validation below must work without it.

## 8. Compile and install a bundled Release build

An iOS device build produces a signed **`.app`**, not an APK or AAB. It bundles React Native JavaScript, while the hosted SIMS website still requires internet access.

Planned commands from the app root, after signing works:

```sh
xcodebuild \
  -workspace ios/SimsMobile.xcworkspace \
  -scheme SimsMobile \
  -configuration Release \
  -destination 'id=YOUR_IPHONE_UDID' \
  -derivedDataPath build/ios \
  -allowProvisioningUpdates \
  build

xcrun devicectl device install app \
  --device YOUR_IPHONE_UDID \
  build/ios/Build/Products/Release-iphoneos/SimsMobile.app

xcrun devicectl device process launch \
  --device YOUR_IPHONE_UDID \
  com.vineethreddy.simsmobile.dev
```

Validate workspace/scheme/product path against the generated app and correct these instructions if needed. Alternatively, edit the scheme's Run configuration to Release in Xcode and Run on the phone. Restore Debug afterward for development.

Stop Metro with Ctrl+C, terminate the installed app, relaunch it from the phone's home screen, and verify protected chat and streaming. Repeat with the Mac disconnected.

An **`.ipa`** is an iOS export/distribution package that needs an appropriate signing/export method. IPA distribution, archives for distribution, TestFlight, and store submission are deferred; a generally installable IPA is not promised for this personal-device milestone. Android APK/AAB instructions will be added and validated during the later Android phase.

## 9. Automated checks after implementation

```sh
npx tsc --noEmit
npm run lint
npm test -- --runInBand
```

Focused tests cover navigation decisions, authentication redirects/new windows, rejected schemes, main-page loading/error/Retry, and content-process recovery. Mocked tests do not establish that company login, native file selection, or real WebView streaming works; those require phone testing.

## 10. Device test report

Every application workflow is currently **NOT TESTED**. During execution record **PASSED**, **FAILED**, or **NOT TESTED**, plus date, device/OS, commit/build configuration, steps, observed result, and evidence:

- NOT TESTED — Untouched starter signs, builds, installs, and launches.
- NOT TESTED — Company Microsoft login returns to protected SIMS chat inside the WebView; cancelled/failed login remains recoverable.
- NOT TESTED — Message sends and the response streams incrementally.
- NOT TESTED — Keyboard, typing, scrolling, rotation, notch/home-indicator safe areas.
- NOT TESTED — Background/foreground, reopening, session persistence/expiration, and sign-out. Persistence follows the website's existing storage semantics; permanent login is not promised.
- NOT TESTED — File selection/upload, picker cancellation, and upload failure.
- NOT TESTED — Generated-file download/sharing, including blob-based documents, spreadsheets, and archives.
- NOT TESTED — Ordinary links, authentication redirects, new-window links, and unsupported schemes.
- NOT TESTED — Connection failure, clear error screen, successful Retry, and content-process recovery.
- NOT TESTED — Release launch and streamed chat with Metro stopped and Mac disconnected.

If Microsoft policy blocks embedded login, diagnose and record the error without secrets before proposing native authentication or infrastructure changes. Do not bypass policy.

The existing website uses browser blob downloads in several workflows. If they fail in the WebView, mark the exact workflow FAILED and propose a focused follow-up. No token-transfer bridge or website/backend change is added automatically. Failed workflows remain outstanding.

## 11. Troubleshooting and final handover

- Wrong developer directory: inspect `xcode-select -p` and switch to Xcode.
- Missing phone: check Finder, cable/USB port, unlock/Trust, pairing, and Developer Mode before app code.
- Signing failure: check selected Apple account/team, identifier availability, provisioning/network messages; user handles credentials.
- Missing Node in Xcode: refresh ignored `.xcode.env.local` after `nvm use`.
- CocoaPods/Xcode incompatibility: capture the error, inspect locked versions/project format, then make the smallest justified change.
- Dependency mismatch: use npm/Bundler/CocoaPods lockfiles and the commands above.
- Low disk: recheck free space and skip simulator downloads; do not delete unrelated user data.
- Website behavior difference: compare the hosted website in mobile Safari and WebView, record the difference, and leave website changes outside this milestone.

Final handover includes source, reproducible tested setup/run/build commands, exact resolved versions/lockfiles, test report, known limitations, and remaining account/signing steps. Keep this README current throughout implementation. Do not claim APK/AAB generation or Android readiness until the later Android milestone has been performed.

## Official references

- https://reactnative.dev/docs/set-up-your-environment
- https://reactnative.dev/docs/getting-started-without-a-framework
- https://github.com/react-native-webview/react-native-webview
- https://developer.apple.com/documentation/xcode/managing-your-simulated-and-physical-devices-in-device-hub
- https://developer.apple.com/documentation/xcode/enabling-developer-mode-on-a-device
