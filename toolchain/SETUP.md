# SIMS mobile toolchain

Prepared on 2026-11-13. The mobile repository currently contains a README and toolchain records; the React Native app has not been scaffolded or built.

## Verified versions

- Xcode 27.2 (27B52), selected at /Applications/Xcode.app/Contents/Developer
- iOS SDK 27.2; Xcode first-launch check passed
- NVM Node 24.22.3, npm 11.19.1; NVM default is 24.22.3
- Homebrew Ruby 3.4.12 (Apple Silicon), separate from system Ruby
- Bundler 4.0.23
- CocoaPods 1.15.2 and xcodeproj 1.25.1, resolved from the unmodified React Native Community template 0.88.1 Gemfile
- Watchman 2026.10.26.00; executable version check passed

Gemfile.lock records all resolved Ruby dependency versions. These Gemfile constraints select older CocoaPods/xcodeproj releases; compatibility with an actual Xcode 27.2 app build is not yet tested. Do not change the constraints without diagnosing a build failure.

## Use the tools

Open a new Terminal window, then:

```sh
cd /Users/kancharakuntlavineethreddy/Developer/Project/SIMS/SimsMobile/toolchain
nvm use
ruby --version
bundle --version
bundle install
bundle exec pod --version
watchman --version
```

The local, ignored `.bundle/config` installs gems at `~/.local/share/sims-mobile-toolchain/bundle`. On another Mac, configure a local installation path before `bundle install`:

```sh
bundle config set --local path vendor/bundle
bundle install
```

CocoaPods is intentionally invoked through Bundler to use the locked dependencies. After app creation, migrate this Gemfile and lockfile into the app's root and configure its bundle path there.

## Xcode and Node

The following absolute executable was verified in an empty environment:

```text
/Users/kancharakuntlavineethreddy/.nvm/versions/node/v24.22.3/bin/node
```

When the iOS project exists, set its local `.xcode.env.local` NODE_BINARY to that absolute path and validate it with a real build. The project-specific setting has not been created yet.

The shell setup in ~/.zshrc adds Homebrew Ruby and its gem executables to PATH and selects NVM's default Node. Already-running terminals may still require `nvm use default`.

## Device connection

Xcode 27 uses Xcode > Open Developer Tool > Device Hub. It manages physical devices and simulators. The + simulator creation dialog is not needed for physical-device testing.

Final device check: iPhone 15 on iOS 26.5, connected by cable, paired, and Developer Mode enabled. Earlier checks showed it unpaired or disconnected; those issues are now resolved. Initial wireless pairing requires iOS 27 or later; no iPhone upgrade is planned.

Apple documentation: https://developer.apple.com/documentation/xcode/managing-your-simulated-and-physical-devices-in-device-hub

Cancel unused simulator downloads to preserve disk space. Apple account selection, signing, native starter build, SIMS authentication and release builds remain unverified. Final available disk space: approximately 19 GiB.

## Installation notes

Watchman's fbthrift dependency conflicted with the existing thrift executable. Installation temporarily unlinked thrift, then unlinked fbthrift and restored thrift afterward. The original thrift package was retained.

Homebrew also installed/upgraded required dependencies, including Ruby's OpenSSL and Watchman's Python dependencies. It linked Python 3.15 as Homebrew's python3 and backed up overwritten links under ~/Library/Caches/Homebrew/Backup. No website or backend source files were changed.

The README-only first commit e879e89 was pushed to https://github.com/eternalbasic1/SimsApp on main. Toolchain records were added locally afterward.
