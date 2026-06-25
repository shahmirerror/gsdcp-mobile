/**
 * Keeps the Expo dev client out of production/preview builds.
 *
 * On Android the dev client (expo-dev-launcher + expo-dev-menu) is autolinked
 * into RELEASE builds too — unlike iOS, which already excludes it via
 * "debugOnly". Shipping it bloats the app, exposes the dev menu, and pulls in
 * the ML Kit code scanner, all of which trigger Google Play warnings.
 *
 * This toggles `expo.autolinking.exclude` in package.json based on the EAS build
 * profile. It runs from `eas-build-post-install` (before prebuild/gradle, so the
 * exclusion is in effect when autolinking resolves). EAS sets EAS_BUILD_PROFILE;
 * locally it's unset, so the dev client stays available for `expo start` and
 * `eas build --profile development`.
 */
const fs = require("fs");
const path = require("path");

const DEV_MODULES = ["expo-dev-client", "expo-dev-launcher", "expo-dev-menu"];

const profile = process.env.EAS_BUILD_PROFILE || "";
// Keep the dev client only for local work and the explicit "development" profile.
const shouldExclude = profile !== "" && profile !== "development";

const pkgPath = path.join(__dirname, "..", "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

pkg.expo = pkg.expo || {};
pkg.expo.autolinking = pkg.expo.autolinking || {};
const exclude = new Set(pkg.expo.autolinking.exclude || []);

if (shouldExclude) {
  DEV_MODULES.forEach((m) => exclude.add(m));
} else {
  DEV_MODULES.forEach((m) => exclude.delete(m));
}

const next = Array.from(exclude);
if (next.length > 0) {
  pkg.expo.autolinking.exclude = next;
} else {
  delete pkg.expo.autolinking.exclude;
  if (Object.keys(pkg.expo.autolinking).length === 0) delete pkg.expo.autolinking;
  if (Object.keys(pkg.expo).length === 0) delete pkg.expo;
}

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(
  `[configure-dev-client] EAS_BUILD_PROFILE="${profile}" → dev client ${
    shouldExclude ? "EXCLUDED from this build" : "kept"
  }`,
);
