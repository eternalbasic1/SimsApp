# SIMS iOS Prototype Implementation Plan

**Goal:** company login and streamed SIMS chat on the physical iPhone, with a bundled Release build that launches without Metro.

**Architecture:** one React Native Community CLI TypeScript WebView screen loading the existing website. The website owns authentication, chat, and storage. Shared code remains suitable for a future Android build.

**Status:** plan only. No app scaffolding or implementation has started. This document follows the user's original SIMS prototype specification, with Android deferred by their latest instruction.

## Constraints

- Separate SimsMobile repository beside simsGPT; preserve its Git history and website/backend source.
- React Native 0.88.1, React 19.3.0, CLI 20.2.0, WebView 17.1.0, matching template tooling/safe-area support.
- Display SIMS; project/scheme SimsMobile; identifier com.vineethreddy.simsmobile.dev; starter artwork.
- Public configuration URL https://simsgpt.6tst.com/chat. No .env, injected JavaScript, token bridge, new APIs, or authentication interfaces.
- Normal persistent WebView storage and HTTPS protections. No Android builds, TestFlight, distribution export, stores, or final branding.
- User handles Apple/company credentials, team selection, and device prompts. Internet remains required for the hosted website.

## 1. Establish the native starter build

- [ ] Recheck disk space, actual tool versions, and iPhone pairing/Developer Mode; record results in README.
- [ ] Generate the pinned SimsMobile template using CLI 20.2.0 in a temporary staging directory; merge into this checkout without replacing Git metadata or existing documentation.
- [ ] Migrate the prepared Gemfile/lockfile to the app root, add root Node/Ruby version files, install JS dependencies, and install Pods through Bundler. Commit dependency lockfiles and ignore local/build/signing files.
- [ ] Set display name and bundle identifier and configure the local absolute Xcode Node executable. Preserve starter UI and template architecture/build settings.
- [ ] User selects Apple account/team; build and launch the untouched starter on the physical phone before WebView integration.
- [ ] Diagnose any actual build failure, including the older locked CocoaPods/xcodeproj versus Xcode 27.2. Document and lock only justified compatibility changes. If signing is deferred, record this gate as incomplete rather than claiming success.

**Gate:** untouched starter visibly runs on the phone with a documented reproducible command/setup sequence.

## 2. Implement the hosted WebView shell

- [ ] Install WebView 17.1.0. Put the public URL in `src/config.ts`; keep the screen and pure navigation decisions in focused TypeScript modules.
- [ ] Use the template safe-area provider without duplicate insets; add initial loading, a clear main-page error screen with Retry, and normal persistent storage.
- [ ] Retry clears the error and reloads the page. Do not replace the screen for unrelated subresource failures.
- [ ] Reload/remount on iOS content-process termination; keep platform callbacks and shared logic compatible with future Android recovery.
- [ ] Initially keep HTTPS navigation, including Microsoft redirects, inside the WebView. Route HTTPS new-window requests to the same WebView. Keep expected blob navigation available for testing; reject arbitrary top-level file/data/javascript/custom schemes. Handle user-initiated mailto/tel links with platform linking.
- [ ] Keep ordinary HTTPS external links inside the WebView for this prototype. Observe real authentication redirects before tightening rules; do not invent a company-auth whitelist or redirect login to Safari.
- [ ] Do not clear website storage on startup, persist credentials natively, log tokens, inject JS, or add TLS/ATS exceptions.

**Gate:** SIMS loads with usable safe areas, loading/error/Retry behavior, and no website/authentication changes.

## 3. Test Microsoft authentication first

- [ ] User signs in using an authorized company account. Record only non-sensitive redirect origins/error codes. Verify protected chat opens inside the WebView.
- [ ] Test cancelled/failed login recovery, background/foreground, reopening, expiration, and sign-out. Preserve the existing website's session semantics.
- [ ] If embedded login is policy-blocked, diagnose and report the exact cause. Propose native authentication/infrastructure changes separately; do not implement an implicit fallback.

**Gate:** real company login returns to protected chat, or an explicit blocker/focused follow-up is reported.

## 4. Test chat, lifecycle, navigation, and files

- [ ] Send a real message; confirm incremental streamed output.
- [ ] Test keyboard/typing/scrolling, safe areas, rotation, backgrounding, reopening, and session persistence.
- [ ] Test ordinary links, same/new-window links, Microsoft navigation, and rejected schemes; adjust only wrapper handling based on observed behavior.
- [ ] Test file selection/upload, cancellation/failure, and generated-file download/sharing. Include the website's blob-based document/spreadsheet/archive workflows.
- [ ] Record each workflow as PASSED, FAILED, or NOT TESTED with device/date/build and reproduction steps. Failed blob downloads remain outstanding; native bridges or website changes require a separately scoped follow-up.

**Gate:** login/chat work and every file workflow has an explicit honest result.

## 5. Automated validation and standalone Release build

- [ ] Add focused Jest tests for HTTPS/auth/new-window decisions, rejected schemes, loading/error/Retry transitions, and content-process recovery. Mocked WebView tests are not proof of real authentication/streaming.
- [ ] Run `npx tsc --noEmit`, `npm run lint`, and `npm test -- --runInBand`; resolve relevant failures.
- [ ] Compile, sign, install, and launch Release on the physical phone using the README flow. Verify actual workspace/scheme/product paths and correct documentation.
- [ ] Stop Metro, terminate/relaunch from the home screen, disconnect the Mac, and verify protected chat and streamed messages. Keep internet available.

**Gate:** checks pass and the real bundled Release app works without Metro; untested/failed gates remain explicit.

## 6. Documentation and handover

- [ ] Update README throughout execution with completed changes, prerequisites, clean-machine installation, clone/dependency setup, signing, Debug run, Release build/install, versions, troubleshooting, and test outcomes.
- [ ] Remove planned-command labels only after commands are actually validated. Record any remaining failures and user account steps; keep secrets/local signing files out of Git.
- [ ] Explain iOS .app versus .ipa and future Android APK/AAB; distribution and Android remain deferred.
- [ ] Review the final diff and clean-checkout instructions. Commit scoped implementation/documentation changes. Do not implicitly publish binaries or submit to stores.

**Prototype acceptance:** company login and streamed chat pass on the physical iPhone; bundled Release launch passes without Metro; every other workflow has an explicit result; README provides reproducible verified instructions.
