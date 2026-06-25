import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { navigationRef } from "../navigation/navigationRef";

const BASE_URL = "https://gsdcp.org/api/mobile";
const FCM_TOKEN_KEY = "gsdcp_fcm_token";
const FCM_LAST_ERROR_KEY = "gsdcp_fcm_last_error";

// Keep startup resilient: notification handler setup should never crash app boot.
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch {
  // Non-critical — app should still run if notifications cannot initialize yet.
}

export async function getStoredFcmToken(): Promise<string | null> {
  return AsyncStorage.getItem(FCM_TOKEN_KEY);
}

export async function getLastFcmRegistrationError(): Promise<string | null> {
  return AsyncStorage.getItem(FCM_LAST_ERROR_KEY);
}

function authHeaders(authToken?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  return headers;
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

/** POST the device token to the backend (creates or refreshes the row). Throws on failure. */
async function saveFcmTokenToServer(
  fcmToken: string,
  userId?: number | null,
  authToken?: string | null,
): Promise<void> {
  const body: Record<string, string | number> = {
    token: fcmToken,
    fcm_token: fcmToken,
    device_token: fcmToken,
    device_type: Platform.OS,
    platform: Platform.OS,
  };
  if (typeof userId === "number") {
    body.user_id = userId;
  }

  const res = await fetch(`${BASE_URL}/profile/set-fcm-token`, {
    method: "POST",
    headers: authHeaders(authToken),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const responseText = await res.text();
    throw new Error(
      `save_failed_status_${res.status}${responseText ? `:${responseText.slice(0, 200)}` : ""}`,
    );
  }
}

/**
 * Asks the backend whether this exact device token is already stored for the
 * user. On any uncertainty (network/parse/endpoint error) returns false so the
 * caller errs on the side of (re)registering.
 */
async function isFcmTokenSavedOnServer(
  fcmToken: string,
  userId?: number | null,
  authToken?: string | null,
): Promise<boolean> {
  try {
    const body: Record<string, string | number> = { token: fcmToken };
    if (typeof userId === "number") {
      body.user_id = userId;
    }
    const res = await fetch(`${BASE_URL}/profile/check-fcm-token`, {
      method: "POST",
      headers: authHeaders(authToken),
      body: JSON.stringify(body),
    });
    if (!res.ok) return false;
    const json = await res.json();
    return json?.exists === true;
  } catch {
    return false;
  }
}

export async function registerPushToken(userId?: number | null, authToken?: string | null): Promise<void> {
  try {
    if (Platform.OS === "web") return;
    if (!Device.isDevice) return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      await AsyncStorage.setItem(FCM_LAST_ERROR_KEY, "notifications_permission_not_granted");
      return;
    }

    await ensureAndroidChannel();

    const tokenData = await Notifications.getDevicePushTokenAsync();
    const fcmToken = String(tokenData.data ?? "").trim();
    if (!fcmToken) {
      await AsyncStorage.setItem(FCM_LAST_ERROR_KEY, "empty_device_push_token");
      return;
    }

    await AsyncStorage.setItem(FCM_TOKEN_KEY, fcmToken);
    await saveFcmTokenToServer(fcmToken, userId, authToken);
    await AsyncStorage.removeItem(FCM_LAST_ERROR_KEY);
  } catch (error) {
    // Non-critical — keep app stable, but persist reason for troubleshooting.
    try {
      const errorMessage = error instanceof Error ? error.message : "unknown_registration_error";
      await AsyncStorage.setItem(FCM_LAST_ERROR_KEY, errorMessage);
    } catch {
      // Ignore nested storage failures.
    }
  }
}

/**
 * Silent self-heal for devices whose token never made it to the backend (e.g.
 * early-access installs from before the server could store tokens).
 *
 * Safe to call on every launch for a logged-in user: it NEVER prompts for
 * permission and never shows UI. If notification permission is already granted
 * and the token isn't on the server yet, it registers it quietly; otherwise it
 * does nothing. Failures are swallowed so the user's experience is untouched.
 */
export async function ensureDeviceTokenRegistered(
  userId?: number | null,
  authToken?: string | null,
): Promise<void> {
  try {
    if (Platform.OS === "web") return;
    if (!Device.isDevice) return;

    // Never request permission here — only proceed if it's already granted,
    // so we don't disturb the user with a system prompt on launch.
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;

    await ensureAndroidChannel();

    const tokenData = await Notifications.getDevicePushTokenAsync();
    const fcmToken = String(tokenData.data ?? "").trim();
    if (!fcmToken) return;

    await AsyncStorage.setItem(FCM_TOKEN_KEY, fcmToken);

    // Already stored for this user → nothing to do.
    if (await isFcmTokenSavedOnServer(fcmToken, userId, authToken)) return;

    // Missing → register it silently.
    await saveFcmTokenToServer(fcmToken, userId, authToken);
    await AsyncStorage.removeItem(FCM_LAST_ERROR_KEY);
  } catch {
    // Silent by design — must not affect the user's experience.
  }
}

export async function unregisterPushToken(userId: number, authToken?: string | null): Promise<void> {
  try {
    if (Platform.OS === "web") return;

    const fcmToken = await getStoredFcmToken();
    if (!fcmToken) return;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    await fetch(`${BASE_URL}/profile/logout`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        token: fcmToken,
        fcm_token: fcmToken,
        device_token: fcmToken,
        user_id: userId,
      }),
    });

    await AsyncStorage.removeItem(FCM_TOKEN_KEY);
  } catch {
    // Non-critical — silently ignore if unregistration fails
  }
}

/**
 * Called when the user taps a notification (foreground, background, or
 * killed-state). Reads the data payload and navigates to the relevant screen.
 *
 * Expected server data payload fields:
 *   type  — "show" | "dog" | "news" | "member" | "kennel"  (optional)
 *   id    — entity ID string/number                          (optional)
 *   name  — display name                                     (optional)
 */
export function handleNotificationResponse(
  response: Notifications.NotificationResponse,
): void {
  const data = (response.notification.request.content.data ?? {}) as Record<string, any>;
  navigateFromNotificationData(data);
}

function navigateFromNotificationData(data: Record<string, any>): void {
  if (!navigationRef.isReady()) {
    // Navigator not mounted yet — retry after a short delay (e.g. killed-state launch)
    setTimeout(() => navigateFromNotificationData(data), 500);
    return;
  }

  const type = String(data.type ?? "").toLowerCase();
  const id   = data.id != null ? String(data.id) : undefined;
  const name = data.name != null ? String(data.name) : undefined;

  switch (type) {
    case "show":
      if (id) {
        navigationRef.navigate("ShowsTab", {
          screen: "ShowDetail",
          params: { id, name },
        });
      }
      break;

    case "dog":
      if (id) {
        navigationRef.navigate("DogsTab", {
          screen: "DogProfile",
          params: { id, name },
        });
      }
      break;

    case "news":
      navigationRef.navigate("TheClubTab", {
        screen: "NewsUpdates",
        params: undefined,
      });
      break;

    case "member":
      if (id) {
        navigationRef.navigate("MemberDirectoryTab", {
          screen: "MemberProfile",
          params: { id },
        });
      }
      break;

    case "kennel":
      if (id) {
        navigationRef.navigate("KennelDirectoryTab", {
          screen: "KennelProfile",
          params: { id, name },
        });
      }
      break;

    default:
      navigationRef.navigate("HomeTab");
      break;
  }
}
