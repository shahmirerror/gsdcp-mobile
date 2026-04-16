#!/usr/bin/env node
/**
 * Patches Android build.gradle files in node_modules to fix two classes of
 * issues that affect React Native 0.81 + Expo 54 + AGP 8.11.0 builds:
 *
 * 1. react-native-worklets declares AGP 8.2.1 in its own buildscript block,
 *    conflicting with AGP 8.11.0 required by @react-native/gradle-plugin,
 *    causing every Android library subproject to report "No variants exist".
 *
 * 2. Several libraries use `packagingOptions {}` which is deprecated in AGP 8+
 *    (replaced by `packaging {}`), generating Gradle 9.0 incompatibility
 *    warnings that can fail EAS builds.
 */
const fs = require('fs');
const path = require('path');

const nodeModules = path.join(__dirname, '..', 'node_modules');

// --- Fix 1: Remove conflicting AGP classpath from worklets ---
const workletsBuildGradle = path.join(
  nodeModules,
  'react-native-worklets',
  'android',
  'build.gradle',
);

if (fs.existsSync(workletsBuildGradle)) {
  let content = fs.readFileSync(workletsBuildGradle, 'utf8');
  const patched = content.replace(
    /[ \t]*classpath\s+"com\.android\.tools\.build:gradle:[^"]+"\s*\r?\n/,
    '',
  );
  if (patched !== content) {
    fs.writeFileSync(workletsBuildGradle, patched);
    console.log('[patch-native-libs] Removed conflicting AGP classpath from react-native-worklets/android/build.gradle');
  } else {
    console.log('[patch-native-libs] worklets AGP classpath: already patched or not found.');
  }
} else {
  console.log('[patch-native-libs] react-native-worklets not found, skipping fix 1.');
}

// --- Fix 2: Replace deprecated `packagingOptions` with `packaging` ---
// AGP 8+ deprecated the packagingOptions {} block in favour of packaging {}.
// The replacement is a simple rename since AGP accepts both syntaxes during
// the deprecation period, but the new name silences the Gradle 9.0 warning.
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
  // Replace standalone `packagingOptions {` with `packaging {`.
  // Uses word boundary to avoid replacing inside strings or comments.
  const patched = content.replace(/\bpackagingOptions(\s*\{)/g, 'packaging$1');
  if (patched !== content) {
    fs.writeFileSync(gradleFile, patched);
    console.log(`[patch-native-libs] Replaced packagingOptions->packaging in ${lib}/android/build.gradle`);
  }
}
