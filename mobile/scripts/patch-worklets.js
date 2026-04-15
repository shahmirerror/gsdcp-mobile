#!/usr/bin/env node
/**
 * Removes the conflicting AGP classpath from react-native-worklets'
 * android/build.gradle. That file declares AGP 8.2.1 in its own buildscript
 * block which conflicts with the project's AGP 8.11.0 (required by
 * @react-native/gradle-plugin for RN 0.81.x), causing all Android library
 * subprojects to report "No variants exist" during Gradle resolution.
 */
const fs = require('fs');
const path = require('path');

const buildGradle = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-worklets',
  'android',
  'build.gradle',
);

if (!fs.existsSync(buildGradle)) {
  console.log('[patch-worklets] react-native-worklets not found, skipping.');
  process.exit(0);
}

let content = fs.readFileSync(buildGradle, 'utf8');

// Remove only the AGP classpath line; keep download-task and spotless.
const patched = content.replace(
  /[ \t]*classpath\s+"com\.android\.tools\.build:gradle:[^"]+"\s*\r?\n/,
  '',
);

if (patched === content) {
  console.log('[patch-worklets] Already patched or pattern not found.');
} else {
  fs.writeFileSync(buildGradle, patched);
  console.log('[patch-worklets] Removed conflicting AGP classpath from react-native-worklets/android/build.gradle');
}
