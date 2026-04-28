import { useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import InAppUpdates, {
  IAUUpdateKind,
  StatusUpdateEvent,
  IAUInstallStatus,
} from "sp-react-native-in-app-updates";
import { getChangesForVersion } from "./whatsNew";

const LAST_SEEN_VERSION_KEY = "@gsdcp/last_seen_version";

const inAppUpdates = new InAppUpdates(false);

type UseAppUpdateResult = {
  /** True when a new version has been installed — show WhatsNewModal */
  showWhatsNew: boolean;
  whatsNewVersion: string;
  whatsNewChanges: string[];
  dismissWhatsNew: () => void;
};

export function useAppUpdate(): UseAppUpdateResult {
  const currentVersion = Constants.expoConfig?.version ?? "1.0.0";

  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [whatsNewChanges, setWhatsNewChanges] = useState<string[]>([]);

  // ─── What's New detection ────────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(LAST_SEEN_VERSION_KEY).then((lastSeen) => {
      if (lastSeen !== currentVersion) {
        const changes = getChangesForVersion(currentVersion);
        if (changes && changes.length > 0) {
          setWhatsNewChanges(changes);
          setShowWhatsNew(true);
        }
        // Mark this version as seen (even if no changelog entry, so we don't
        // re-check on every startup)
        AsyncStorage.setItem(LAST_SEEN_VERSION_KEY, currentVersion);
      }
    });
  }, [currentVersion]);

  const dismissWhatsNew = useCallback(() => {
    setShowWhatsNew(false);
  }, []);

  // ─── Play Store / App Store update check ────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const checkForUpdate = async () => {
      try {
        const result = await inAppUpdates.checkNeedsUpdate();
        if (!mounted || !result.shouldUpdate) return;

        if (Platform.OS === "android") {
          // Flexible update: downloads in the background, user can keep using
          // the app, then we prompt to restart when it's ready.
          inAppUpdates.addStatusUpdateListener(onStatusUpdate);
          await inAppUpdates.startUpdate({ updateType: IAUUpdateKind.FLEXIBLE });
        } else {
          // iOS: show native App Store alert
          await inAppUpdates.startUpdate({
            title: "Update Available",
            message:
              "A new version of the GSDCP app is available on the App Store.",
            buttonUpgradeText: "Update",
            buttonCancelText: "Later",
            forceUpgrade: false,
          } as any);
        }
      } catch {
        // Silently ignore — update check is non-critical
      }
    };

    checkForUpdate();

    return () => {
      mounted = false;
      if (Platform.OS === "android") {
        inAppUpdates.removeStatusUpdateListener(onStatusUpdate);
      }
    };
  }, []);

  return {
    showWhatsNew,
    whatsNewVersion: currentVersion,
    whatsNewChanges,
    dismissWhatsNew,
  };
}

// ─── Flexible update status listener ────────────────────────────────────────
function onStatusUpdate(event: StatusUpdateEvent) {
  const { status } = event;
  if (status === IAUInstallStatus.DOWNLOADED) {
    // Download complete — trigger the install (app will restart)
    inAppUpdates.installUpdate();
  }
}
