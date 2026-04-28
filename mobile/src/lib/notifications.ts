import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { navigationRef } from "../navigation/navigationRef";

const BASE_URL = "https://gsdcp.org/api/mobile";
const FCM_TOKEN_KEY = "gsdcp_fcm_token";

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

export async function registerPushToken(userId: number): Promise<void> {
  try {
    if (Platform.OS === "web") return;
    if (!Device.isDevice) return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const tokenData = await Notifications.getDevicePushTokenAsync();
    const fcmToken = tokenData.data as string;

    await AsyncStorage.setItem(FCM_TOKEN_KEY, fcmToken);

    await fetch(`${BASE_URL}/profile/set-fcm-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        token: fcmToken,
        user_id: userId,
        device_type: Platform.OS,
      }),
    });
  } catch {
    // Non-critical — silently ignore if push registration fails
  }
}

export async function unregisterPushToken(userId: number): Promise<void> {
  try {
    if (Platform.OS === "web") return;

    const fcmToken = await getStoredFcmToken();
    if (!fcmToken) return;

    await fetch(`${BASE_URL}/profile/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        token: fcmToken,
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
