const { AndroidConfig, withAndroidManifest } = require("expo/config-plugins");

/**
 * Google Play "Photo and Video Permissions" policy compliance.
 *
 * The app only needs occasional access to pick an image/video for upload, which
 * the Android Photo Picker (used by expo-image-picker's launchImageLibraryAsync
 * on SDK 51+) handles WITHOUT any runtime permission. We therefore block the
 * broad media/storage permissions so they can never be merged into the final
 * AAB from expo-image-picker's library manifest or any transitive dependency.
 *
 * CAMERA is intentionally NOT blocked — it is required for launchCameraAsync.
 */
const BLOCKED_PERMISSIONS = [
  "android.permission.READ_MEDIA_IMAGES",
  "android.permission.READ_MEDIA_VIDEO",
  "android.permission.READ_MEDIA_VISUAL_USER_SELECTED",
  "android.permission.READ_EXTERNAL_STORAGE",
  "android.permission.WRITE_EXTERNAL_STORAGE",
  "android.permission.RECORD_AUDIO",
];

const withBlockedMediaPermissions = (config) =>
  withAndroidManifest(config, (cfg) => {
    // Strip any already-declared copies, then add explicit removal markers.
    AndroidConfig.Permissions.removePermissions(cfg.modResults, BLOCKED_PERMISSIONS);

    const manifest = cfg.modResults.manifest;
    manifest.$ = manifest.$ || {};
    manifest.$["xmlns:tools"] =
      manifest.$["xmlns:tools"] || "http://schemas.android.com/tools";
    manifest["uses-permission"] = manifest["uses-permission"] || [];

    for (const name of BLOCKED_PERMISSIONS) {
      const already = manifest["uses-permission"].some(
        (p) =>
          p.$ &&
          p.$["android:name"] === name &&
          p.$["tools:node"] === "remove",
      );
      if (!already) {
        manifest["uses-permission"].push({
          $: { "android:name": name, "tools:node": "remove" },
        });
      }
    }

    return cfg;
  });

module.exports = withBlockedMediaPermissions;
