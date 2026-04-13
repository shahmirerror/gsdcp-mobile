import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
