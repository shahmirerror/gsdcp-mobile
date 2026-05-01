#!/usr/bin/env node
/**
 * Patches Android build.gradle files in node_modules to fix two classes of
 * issues that affect React Native 0.81 + Expo 54 + AGP 8.11.0 builds:
 *
 * 1. Several native modules declare their own AGP version in a buildscript
 *    block, conflicting with AGP 8.11.0 required by @react-native/gradle-plugin.
 *    This causes every Android library subproject to report "No variants exist".
 *    Known offenders and their formats:
 *      - react-native-worklets:       classpath "com.android.tools.build:gradle:8.2.1"
 *      - react-native-reanimated:     classpath "com.android.tools.build:gradle:8.2.1"
 *      - react-native-screens:        classpath 'com.android.tools.build:gradle:8.2.1'
 *      - react-native-gesture-handler:classpath("com.android.tools.build:gradle:8.10.1")
 *      - react-native-safe-area-context:classpath("com.android.tools.build:gradle:7.3.1")
 *
 * 2. @react-native-async-storage/async-storage declares a top-level
 *    `configurations { compileClasspath }` block that pre-creates the
 *    `compileClasspath` configuration.  AGP 8.11.0 also tries to create that
 *    configuration when applying `com.android.library`, causing a conflict that
 *    prevents any variants from being registered ("No variants exist").
 *
 * 3. Several libraries use `packagingOptions {}` which is deprecated in AGP 8+
 *    (replaced by `packaging {}`), generating Gradle 9.0 incompatibility
 *    warnings that can fail EAS builds.
 *
 * 4. Multiple libraries still use lintOptions {} which was removed in AGP 8.0 (use lint {}).
 *    This throws MissingMethodException during project evaluation, leaving the project with
 *    zero registered variants ("No variants exist").
 *    Also removes buildToolsVersion which is deprecated for library modules in AGP 8.x.
 *
 * 5. android.compileSdkVersion(int) was removed in AGP 8.x. All 8 failing libraries use
 *    the old "compileSdkVersion X" method call inside android {} which throws
 *    MissingMethodException. The app/build.gradle was updated to use "compileSdk X" (property
 *    setter) but the library packages were not. Fix: replace compileSdkVersion → compileSdk
 *    on lines that are the method-call form at the start of an indented line.
 */
const fs = require('fs');
const path = require('path');

const nodeModules = path.join(__dirname, '..', 'node_modules');

// Matches all quote/paren formats:
//   classpath "com.android.tools.build:gradle:X.X.X"
//   classpath 'com.android.tools.build:gradle:X.X.X'
//   classpath("com.android.tools.build:gradle:X.X.X")
//   classpath('com.android.tools.build:gradle:X.X.X')
const AGP_CLASSPATH_REGEX =
  /[ \t]*classpath[\s(]["']com\.android\.tools\.build:gradle:[^"']+["']\)?\s*\r?\n/g;

// --- Fix 1: Remove conflicting AGP classpath from all problem libraries ---
const libsWithAgp = [
  'react-native-worklets',
  'react-native-reanimated',
  'react-native-gesture-handler',
  'react-native-screens',
  'react-native-safe-area-context',
];

for (const lib of libsWithAgp) {
  const gradleFile = path.join(nodeModules, lib, 'android', 'build.gradle');
  if (!fs.existsSync(gradleFile)) {
    console.log(`[patch-native-libs] ${lib} not found, skipping AGP fix.`);
    continue;
  }
  let content = fs.readFileSync(gradleFile, 'utf8');
  const patched = content.replace(AGP_CLASSPATH_REGEX, '');
  if (patched !== content) {
    fs.writeFileSync(gradleFile, patched);
    console.log(`[patch-native-libs] Removed conflicting AGP classpath from ${lib}/android/build.gradle`);
  } else {
    console.log(`[patch-native-libs] ${lib} AGP classpath: already patched or not found.`);
  }
}

// --- Fix 2: Replace deprecated `packagingOptions` with `packaging` ---
// AGP 8+ deprecated the packagingOptions {} block in favour of packaging {}.
const libsToFix = [
  'react-native-worklets',
  'react-native-reanimated',
  'react-native-gesture-handler',
  'react-native-screens',
  'react-native-safe-area-context',
];

for (const lib of libsToFix) {
  const gradleFile = path.join(nodeModules, lib, 'android', 'build.gradle');
  if (!fs.existsSync(gradleFile)) continue;

  let content = fs.readFileSync(gradleFile, 'utf8');
  const patched = content.replace(/\bpackagingOptions(\s*\{)/g, 'packaging$1');
  if (patched !== content) {
    fs.writeFileSync(gradleFile, patched);
    console.log(`[patch-native-libs] Replaced packagingOptions->packaging in ${lib}/android/build.gradle`);
  }
}

// --- Fix 3: Remove `configurations { compileClasspath }` from async-storage ---
// AGP 8.11.0 creates a `compileClasspath` configuration itself when applying
// com.android.library. The pre-existing user-defined declaration causes a conflict
// that prevents any variants from being registered ("No variants exist").
const asyncStorageGradle = path.join(
  nodeModules,
  '@react-native-async-storage',
  'async-storage',
  'android',
  'build.gradle',
);
if (fs.existsSync(asyncStorageGradle)) {
  let content = fs.readFileSync(asyncStorageGradle, 'utf8');
  const patched = content.replace(
    /^configurations\s*\{[^}]*compileClasspath[^}]*\}\s*\n?/m,
    '',
  );
  if (patched !== content) {
    fs.writeFileSync(asyncStorageGradle, patched);
    console.log('[patch-native-libs] Removed configurations{compileClasspath} from async-storage/android/build.gradle');
  } else {
    console.log('[patch-native-libs] async-storage configurations block: already patched or not found.');
  }
}

// All 8 failing library paths (used by Fix 4 and Fix 5 below):
const failingLibPaths = [
  path.join('sp-react-native-in-app-updates', 'android', 'build.gradle'),
  path.join('react-native-device-info', 'android', 'build.gradle'),
  path.join('react-native-reanimated', 'android', 'build.gradle'),
  path.join('react-native-screens', 'android', 'build.gradle'),
  path.join('react-native-safe-area-context', 'android', 'build.gradle'),
  path.join('react-native-worklets', 'android', 'build.gradle'),
  path.join('react-native-gesture-handler', 'android', 'build.gradle'),
  path.join('@react-native-async-storage', 'async-storage', 'android', 'build.gradle'),
];

// --- Fix 4: Replace lintOptions {} → lint {} and remove buildToolsVersion ---
// AGP 8.0 removed lintOptions {} (replaced by lint {}). Any library that still uses
// lintOptions {} throws a MissingMethodException during project evaluation, leaving it
// with zero registered variants ("No variants exist").
// buildToolsVersion is deprecated/removed for library modules in AGP 8.x.
for (const relPath of failingLibPaths) {
  const gradleFile = path.join(nodeModules, relPath);
  if (!fs.existsSync(gradleFile)) {
    console.log(`[patch-native-libs] ${relPath} not found, skipping Fix 4.`);
    continue;
  }
  let content = fs.readFileSync(gradleFile, 'utf8');
  let patched = content;

  // Replace lintOptions {} with lint {} (removed in AGP 8.0)
  patched = patched.replace(/\blintOptions(\s*\{)/g, 'lint$1');

  // Remove buildToolsVersion lines (deprecated/removed in AGP 8.x for libraries)
  patched = patched.replace(/[ \t]*buildToolsVersion\s+[^\n]+\n/g, '');

  if (patched !== content) {
    fs.writeFileSync(gradleFile, patched);
    console.log(`[patch-native-libs] Fix 4 applied to ${relPath}`);
  } else {
    console.log(`[patch-native-libs] Fix 4: ${relPath} already patched or not needed.`);
  }
}

// --- Fix 5: Replace compileSdkVersion → compileSdk ---
// android.compileSdkVersion(int) was removed in AGP 8.x. All failing library build.gradle
// files use the old method form "compileSdkVersion X" inside android {} which throws
// MissingMethodException: No signature of method 'LibraryExtension.compileSdkVersion()'.
// The replacement is the property setter "compileSdk X" which is equivalent and valid in
// AGP 7.0+.
//
// The regex matches lines that start with whitespace followed by "compileSdkVersion "
// (the method-call pattern), but NOT:
//   - safeExtGet('compileSdkVersion', ...)  <- string argument, different line context
//   - rootProject.ext.compileSdkVersion     <- property access, preceded by '.'
//   - def compileSdkVersion = ...           <- preceded by 'def '
for (const relPath of failingLibPaths) {
  const gradleFile = path.join(nodeModules, relPath);
  if (!fs.existsSync(gradleFile)) {
    console.log(`[patch-native-libs] ${relPath} not found, skipping Fix 5.`);
    continue;
  }
  let content = fs.readFileSync(gradleFile, 'utf8');
  // Replace `compileSdkVersion X` (method call at start of indented line) with `compileSdk X`
  const patched = content.replace(/^([ \t]+)compileSdkVersion(\s+)/gm, '$1compileSdk$2');

  if (patched !== content) {
    fs.writeFileSync(gradleFile, patched);
    console.log(`[patch-native-libs] Fix 5 (compileSdkVersion→compileSdk) applied to ${relPath}`);
  } else {
    console.log(`[patch-native-libs] Fix 5: ${relPath} already patched or not needed.`);
  }
}

// --- Fix 6: Add missing namespace to libraries that don't declare one ---
// AGP 8.3+ requires every Android library module to declare a namespace in
// its build.gradle android {} block. Libraries that rely solely on the
// `package` attribute in AndroidManifest.xml fail to configure under AGP 8.x,
// resulting in "No variants exist." With parallel project configuration enabled,
// these individual failures cascade and abort all other in-flight subproject
// configurations, causing every library to report "No variants exist."
//
// Fix: inject `namespace 'com.example.foo'` as the first line inside the
// android {} block, guarded so it's only added once.
const libsNeedingNamespace = [
  {
    relPath: path.join('sp-react-native-in-app-updates', 'android', 'build.gradle'),
    namespace: 'com.sudoplz.rninappupdates',
  },
  {
    relPath: path.join('react-native-device-info', 'android', 'build.gradle'),
    namespace: 'com.learnium.RNDeviceInfo',
  },
];

for (const { relPath, namespace } of libsNeedingNamespace) {
  const gradleFile = path.join(nodeModules, relPath);
  if (!fs.existsSync(gradleFile)) {
    console.log(`[patch-native-libs] ${relPath} not found, skipping Fix 6.`);
    continue;
  }
  let content = fs.readFileSync(gradleFile, 'utf8');

  if (/\bnamespace\s+/.test(content)) {
    console.log(`[patch-native-libs] Fix 6: ${relPath} already has namespace.`);
    continue;
  }

  // Insert namespace as the first property inside android { ... }
  const patched = content.replace(
    /^(\s*android\s*\{)/m,
    `$1\n    namespace '${namespace}'`,
  );

  if (patched !== content) {
    fs.writeFileSync(gradleFile, patched);
    console.log(`[patch-native-libs] Fix 6 (add namespace '${namespace}') applied to ${relPath}`);
  } else {
    console.log(`[patch-native-libs] Fix 6: could not find android { block in ${relPath}`);
  }
}

// --- Fix 7: Fix react-native-screens Kotlin version fallback ---
// react-native-screens declares `rnsDefaultKotlinVersion = '1.8.0'` in its
// buildscript ext block as the fallback when rootProject.ext.kotlinVersion is
// unavailable. Kotlin 1.8.0 conflicts with the root project's Kotlin 2.1.20,
// causing classpath conflicts and configuration failure.
// Fix: replace the hardcoded '1.8.0' fallback with '2.1.20'.
const screensGradle = path.join(nodeModules, 'react-native-screens', 'android', 'build.gradle');
if (fs.existsSync(screensGradle)) {
  let content = fs.readFileSync(screensGradle, 'utf8');
  const patched = content.replace(
    /rnsDefaultKotlinVersion\s*=\s*['"][^'"]+['"]/,
    "rnsDefaultKotlinVersion = '2.1.20'",
  );
  if (patched !== content) {
    fs.writeFileSync(screensGradle, patched);
    console.log('[patch-native-libs] Fix 7 (screens Kotlin fallback → 2.1.20) applied.');
  } else {
    console.log('[patch-native-libs] Fix 7: screens already patched or pattern not found.');
  }
}

// --- Fix 8: Fix async-storage KSP version for Kotlin 2.1.20 ---
// async-storage's config.gradle has a hardcoded KSP version lookup table that
// tops out at Kotlin 1.9.24. When kotlinVersion=2.1.20, getKspVersion() falls
// back to '1.9.24-1.0.20' (Kotlin 1.9 KSP) which is incompatible with
// Kotlin 2.1.20 in the buildscript classpath. This can cause classpath resolution
// to fail. Fix: override rnsDefaultKotlinVersion in config.gradle to use the
// correct KSP version that matches Kotlin 2.1.20.
const asyncStorageConfig = path.join(
  nodeModules,
  '@react-native-async-storage',
  'async-storage',
  'android',
  'config.gradle',
);
if (fs.existsSync(asyncStorageConfig)) {
  let content = fs.readFileSync(asyncStorageConfig, 'utf8');
  // Replace the DEFAULT_KOTLIN_VERSION so the KSP lookup table uses a version
  // that IS in the list (1.9.24), and separately override the KSP version to
  // 2.1.20-2.0.1 by prepending an early-return guard to getKspVersion.
  // The cleanest fix: replace DEFAULT_KOTLIN_VERSION with the actual kotlin
  // version that matches our KSP entry. Since rootProject.ext.kotlinVersion=2.1.20
  // is used, getKspVersion receives '2.1.20' and finds nothing. Override the
  // function to return the correct version.
  const patched = content.replace(
    /def DEFAULT_KOTLIN_VERSION\s*=\s*["'][^"']+["']/,
    "def DEFAULT_KOTLIN_VERSION = \"1.9.24\"",
  ).replace(
    /String overriddenKspVersion = getPropertyOfDefault\("AsyncStorage_next_kspVersion", null\)/,
    'String overriddenKspVersion = "2.1.20-2.0.1" // patched: use KSP for Kotlin 2.1.20',
  );
  if (patched !== content) {
    fs.writeFileSync(asyncStorageConfig, patched);
    console.log('[patch-native-libs] Fix 8 (async-storage KSP → 2.1.20-2.0.1) applied.');
  } else {
    console.log('[patch-native-libs] Fix 8: async-storage config already patched or pattern not found.');
  }
}


