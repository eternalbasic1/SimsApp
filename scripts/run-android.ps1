# Windows Android build helper — uses Android Studio's bundled JDK (not missing system JDK).
$ErrorActionPreference = 'Stop'

$jbr = 'C:\Program Files\Android\Android Studio\jbr'
if (-not (Test-Path "$jbr\bin\java.exe")) {
  Write-Error "Java not found at $jbr. Install Android Studio or set JAVA_HOME to a valid JDK 17+."
}

$env:JAVA_HOME = $jbr

# Avoid Cursor sandbox Gradle cache — paths exceed Windows MAX_PATH for native builds.
$defaultGradleHome = Join-Path $env:USERPROFILE '.gradle'
if (-not $env:GRADLE_USER_HOME -or $env:GRADLE_USER_HOME -match 'cursor-sandbox-cache') {
  $env:GRADLE_USER_HOME = $defaultGradleHome
}

$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
if ($env:ANDROID_HOME) {
  $env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:PATH"
} else {
  $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
}

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$packagerArgs = @()
if ($args -contains '--no-packager') {
  $packagerArgs += '--no-packager'
  $args = $args | Where-Object { $_ -ne '--no-packager' }
}
if ($args -contains '--port') {
  $i = [Array]::IndexOf($args, '--port')
  if ($i -ge 0 -and $i + 1 -lt $args.Count) {
    $packagerArgs += '--port', $args[$i + 1]
  }
}

npx react-native run-android @packagerArgs @args