import { useEffect } from "react";
import { Alert, Linking, Platform } from "react-native";
import Constants from "expo-constants";
import InAppUpdates, {
  IAUUpdateKind,
  StatusUpdateEvent,
  IAUInstallStatus,
} from "sp-react-native-in-app-updates";

const inAppUpdates = new InAppUpdates(false);

export function useAppUpdate(): void {
  const currentVersion =
    Constants.expoConfig?.version ??
    Constants.nativeAppVersion ??
    "1.0.0";
  const iosBundleId = Constants.expoConfig?.ios?.bundleIdentifier;
  const androidPackage = Constants.expoConfig?.android?.package;

  // ─── Play Store / App Store update check ────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const openStoreFallback = async () => {
      const storeUrl = Platform.OS === "android"
        ? androidPackage
          ? `market://details?id=${androidPackage}`
          : "https://play.google.com/store?gl=PK&hl=en"
        : "https://apps.apple.com/pk/search?term=GSDCP";

      try {
        const canOpen = await Linking.canOpenURL(storeUrl);
        if (canOpen) {
          await Linking.openURL(storeUrl);
          return;
        }
      } catch {
        // Continue to https fallback below.
      }

      if (Platform.OS === "android") {
        await Linking.openURL(
          androidPackage
            ? `https://play.google.com/store/apps/details?id=${androidPackage}&gl=PK&hl=en`
            : "https://play.google.com/store?gl=PK&hl=en",
        );
      } else {
        await Linking.openURL("https://apps.apple.com/pk/search?term=GSDCP");
      }
    };

    const promptStoreFallback = () => {
      Alert.alert(
        "Update Available",
        "A newer version of GSDCP is available in the app store.",
        [
          { text: "Later", style: "cancel" },
          {
            text: "Open Store",
            onPress: () => {
              openStoreFallback().catch(() => {
                // Ignore fallback errors.
              });
            },
          },
        ],
      );
    };

    const checkForUpdate = async () => {
      try {
        const result = await inAppUpdates.checkNeedsUpdate({
          curVersion: currentVersion,
          bundleId: iosBundleId,
          country: "pk",
        });
        if (!mounted || !result.shouldUpdate) return;

        if (Platform.OS === "android") {
          // Flexible update: downloads in the background, user can keep using
          // the app, then we prompt to restart when it's ready.
          inAppUpdates.addStatusUpdateListener(onStatusUpdate);
          try {
            await inAppUpdates.startUpdate({ updateType: IAUUpdateKind.FLEXIBLE });
          } catch {
            promptStoreFallback();
          }
        } else {
          // iOS: show native App Store alert
          try {
            await inAppUpdates.startUpdate({
              title: "Update Available",
              message:
                "A new version of the GSDCP app is available on the App Store.",
              buttonUpgradeText: "Update",
              buttonCancelText: "Later",
              forceUpgrade: false,
              bundleId: iosBundleId,
              country: "pk",
            });
          } catch {
            promptStoreFallback();
          }
        }
      } catch {
        // Silently ignore update-check failures in development environments.
      }
    };

    checkForUpdate();

    return () => {
      mounted = false;
      if (Platform.OS === "android") {
        inAppUpdates.removeStatusUpdateListener(onStatusUpdate);
      }
    };
  }, [androidPackage, currentVersion, iosBundleId]);
}

// ─── Flexible update status listener ────────────────────────────────────────
function onStatusUpdate(event: StatusUpdateEvent) {
  const { status } = event;
  if (status === IAUInstallStatus.DOWNLOADED) {
    // Download complete — trigger the install (app will restart)
    inAppUpdates.installUpdate();
  }
}
