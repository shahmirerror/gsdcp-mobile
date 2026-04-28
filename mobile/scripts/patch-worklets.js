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
