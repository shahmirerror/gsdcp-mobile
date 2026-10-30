import { Platform } from "react-native";

/**
 * Thin wrapper around react-native-fbsdk-next for Meta (Facebook) app-event
 * tracking, used for ads & marketing attribution.
 *
 * The native module only exists in a native build (dev-client / store build),
 * so every call is guarded: on web, in Expo Go, or before the next native
 * rebuild it safely no-ops instead of throwing.
 *
 * ── SETUP (required before events actually reach Meta) ──────────────────────
 *   1. Create an app at https://developers.facebook.com/apps
 *   2. Copy its App ID and Client Token (Settings → Basic / Advanced).
 *   3. In app.json, replace the placeholders in the "react-native-fbsdk-next"
 *      plugin config:
 *        - "appID":       your numeric App ID
 *        - "clientToken": your Client Token
 *        - "scheme":      "fb<APP_ID>"   (literally the letters "fb" + App ID)
 *   4. Rebuild the native app (EAS build, or `npx expo prebuild` + run).
 *
 * Auto-logging of installs/sessions and advertiser-ID collection are enabled
 * through the config plugin; the helpers below add custom + purchase events.
 * ---------------------------------------------------------------------------*/

let fbsdk: any = null;
let loadAttempted = false;

function getFbsdk(): any {
  if (loadAttempted) return fbsdk;
  loadAttempted = true;
  // react-native-web has no native FB SDK; never require it there.
  if (Platform.OS === "web") return null;
  try {
    // Lazy require so the JS bundle still loads if the native module is absent
    // (Expo Go, or a build made before the plugin was added).
    fbsdk = require("react-native-fbsdk-next");
  } catch {
    fbsdk = null;
  }
  return fbsdk;
}

let initialized = false;

/**
 * Initializes the Meta SDK. Call once on app startup. Safe to call anywhere —
 * it no-ops when the native module or real credentials aren't present.
 */
export function initFacebookAnalytics(): void {
  const sdk = getFbsdk();
  if (!sdk?.Settings || initialized) return;
  try {
    sdk.Settings.initializeSDK();
    // Enables advertiser tracking for attribution. On iOS 14.5+ this should be
    // gated behind an App Tracking Transparency prompt (expo-tracking-transparency)
    // for full compliance; left on here so Android + opted-in iOS users attribute.
    if (typeof sdk.Settings.setAdvertiserTrackingEnabled === "function") {
      sdk.Settings.setAdvertiserTrackingEnabled(true);
    }
    initialized = true;
  } catch {
    // Never let analytics break app startup.
  }
}

/** Logs a custom app event (e.g. "ViewedContent", "Search", "CompletedRegistration"). */
export function logFacebookEvent(
  eventName: string,
  params?: Record<string, string | number>,
): void {
  const sdk = getFbsdk();
  if (!sdk?.AppEventsLogger) return;
  try {
    sdk.AppEventsLogger.logEvent(eventName, params as any);
  } catch {
    // ignore
  }
}

/** Logs a purchase for ROAS / value-based ad optimisation. */
export function logFacebookPurchase(
  amount: number,
  currency: string,
  params?: Record<string, string | number>,
): void {
  const sdk = getFbsdk();
  if (!sdk?.AppEventsLogger) return;
  try {
    sdk.AppEventsLogger.logPurchase(amount, currency, params as any);
  } catch {
    // ignore
  }
}

/** Associates events with a stable user id (call on login, clear on logout). */
export function setFacebookUserId(userId: string | null): void {
  const sdk = getFbsdk();
  if (!sdk?.AppEventsLogger) return;
  try {
    if (userId) {
      sdk.AppEventsLogger.setUserID(String(userId));
    } else if (typeof sdk.AppEventsLogger.clearUserID === "function") {
      sdk.AppEventsLogger.clearUserID();
    }
  } catch {
    // ignore
  }
}
