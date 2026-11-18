# Build Play Store release AAB from repo root (Windows).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$gradleProps = Join-Path $root "android\gradle.properties"

if (-not (Test-Path (Join-Path $root "android\keystore.properties"))) {
    Write-Warning @"
android/keystore.properties not found. Release will be signed with the DEBUG key.
Google Play will reject debug-signed bundles for distribution.
See docs/android-play-store-release.md to create an upload keystore first.
"@
}

if ($root.Length -gt 80) {
    Write-Warning @"
Project path is long ($($root.Length) chars). CMake may fail with MAX_PATH on Windows.
Use a short path such as C:\SimsApp or build on macOS. See docs/android-play-store-release.md.
"@
}

Push-Location (Join-Path $root "android")
try {
    & .\gradlew.bat :app:bundleRelease @args
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    $aab = Join-Path $root "android\app\build\outputs\bundle\release\app-release.aab"
    if (Test-Path $aab) {
        Write-Host ""
        Write-Host "AAB ready: $aab" -ForegroundColor Green
    }
} finally {
    Pop-Location
}