import { Linking, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import Constants from "expo-constants";

const LAST_ERROR_REPORT_KEY = "@gsdcp/last_error_report";
const AUTH_STORAGE_KEY = "gsdcp_auth_user";

type ErrorReport = {
  app: {
    name: string;
    version: string;
    runtimeVersion: string | null;
    releaseChannel: string | null;
    platform: string;
  };
  device: {
    brand: string | null;
    manufacturer: string | null;
    modelName: string | null;
    osName: string | null;
    osVersion: string | null;
    deviceType: string | null;
    isDevice: boolean;
  };
  user: {
    id: number | null;
    username: string | null;
    membershipNo: string | null;
  };
  error: {
    message: string;
    stack: string | null;
    isFatal: boolean;
    context: Record<string, unknown>;
  };
  occurredAt: string;
};

type ErrorReportingConfig = {
  supportEmail: string | null;
  webhookUrl: string | null;
};

let initialized = false;

function readConfig(): ErrorReportingConfig {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, any>;
  const errorReporting = (extra.errorReporting ?? {}) as Record<string, any>;

  const str = (v: unknown): string | null =>
    typeof v === "string" && (v as string).trim() ? (v as string).trim() : null;

  return {
    supportEmail: str(errorReporting.supportEmail ?? extra.supportEmail),
    webhookUrl: str(errorReporting.webhookUrl),
  };
}

function getDeviceTypeLabel(deviceType: Device.DeviceType | null): string | null {
  if (deviceType == null) return null;
  switch (deviceType) {
    case Device.DeviceType.PHONE:
      return "PHONE";
    case Device.DeviceType.TABLET:
      return "TABLET";
    case Device.DeviceType.DESKTOP:
      return "DESKTOP";
    case Device.DeviceType.TV:
      return "TV";
    default:
      return "UNKNOWN";
  }
}

async function getUserSnapshot(): Promise<ErrorReport["user"]> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return { id: null, username: null, membershipNo: null };
    }
    const parsed = JSON.parse(raw);
    return {
      id: typeof parsed?.id === "number" ? parsed.id : null,
      username: typeof parsed?.username === "string" ? parsed.username : null,
      membershipNo: typeof parsed?.membership_no === "string" ? parsed.membership_no : null,
    };
  } catch {
    return { id: null, username: null, membershipNo: null };
  }
}

async function buildErrorReport(
  error: unknown,
  context: Record<string, unknown>,
  isFatal: boolean,
): Promise<ErrorReport> {
  const err = error instanceof Error ? error : new Error(String(error ?? "Unknown error"));
  const user = await getUserSnapshot();

  return {
    app: {
      name: Constants.expoConfig?.name ?? "GSDCP",
      version: Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "unknown",
      runtimeVersion: Constants.expoConfig?.runtimeVersion
        ? String(Constants.expoConfig.runtimeVersion)
        : null,
      releaseChannel: (Constants.expoConfig?.updates as any)?.channel ?? null,
      platform: Platform.OS,
    },
    device: {
      brand: Device.brand ?? null,
      manufacturer: Device.manufacturer ?? null,
      modelName: Device.modelName ?? null,
      osName: Device.osName ?? null,
      osVersion: Device.osVersion ?? null,
      deviceType: getDeviceTypeLabel(Device.deviceType ?? null),
      isDevice: Device.isDevice,
    },
    user,
    error: {
      message: err.message,
      stack: err.stack ?? null,
      isFatal,
      context,
    },
    occurredAt: new Date().toISOString(),
  };
}

async function sendReportToWebhook(report: ErrorReport, webhookUrl: string): Promise<void> {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(report),
  });

  if (!res.ok) {
    throw new Error(`error_report_webhook_failed_${res.status}`);
  }
}

function buildMailtoUrl(supportEmail: string, report: ErrorReport): string {
  const subject = `[GSDCP Error] ${report.error.isFatal ? "Fatal" : "Non-fatal"} - ${report.error.message}`;
  const body = [
    "A GSDCP app error occurred.",
    "",
    `Time: ${report.occurredAt}`,
    `Platform: ${report.app.platform}`,
    `App Version: ${report.app.version}`,
    `Runtime Version: ${report.app.runtimeVersion ?? "n/a"}`,
    "",
    `Device: ${report.device.brand ?? "n/a"} ${report.device.modelName ?? "n/a"}`,
    `Manufacturer: ${report.device.manufacturer ?? "n/a"}`,
    `OS: ${report.device.osName ?? "n/a"} ${report.device.osVersion ?? "n/a"}`,
    `Device Type: ${report.device.deviceType ?? "n/a"}`,
    "",
    `User ID: ${report.user.id ?? "n/a"}`,
    `Username: ${report.user.username ?? "n/a"}`,
    `Membership No: ${report.user.membershipNo ?? "n/a"}`,
    "",
    `Fatal: ${report.error.isFatal ? "yes" : "no"}`,
    `Message: ${report.error.message}`,
    "",
    "Stack:",
    report.error.stack ?? "n/a",
    "",
    "Context:",
    JSON.stringify(report.error.context, null, 2),
  ].join("\n");

  return `mailto:${encodeURIComponent(supportEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

async function tryOpenEmailFallback(report: ErrorReport, supportEmail: string | null): Promise<void> {
  if (!supportEmail) return;

  const mailtoUrl = buildMailtoUrl(supportEmail, report);
  const canOpen = await Linking.canOpenURL(mailtoUrl);
  if (canOpen) {
    await Linking.openURL(mailtoUrl);
  }
}

export async function captureErrorReport(
  error: unknown,
  context: Record<string, unknown> = {},
  isFatal = false,
): Promise<void> {
  try {
    const report = await buildErrorReport(error, context, isFatal);
    const config = readConfig();

    await AsyncStorage.setItem(LAST_ERROR_REPORT_KEY, JSON.stringify(report));

    // 1. Try webhook (your backend email service)
    if (config.webhookUrl) {
      try {
        await sendReportToWebhook(report, config.webhookUrl);
        return;
      } catch {
        // Fall through to mailto fallback.
      }
    }

    // 2. Last resort: open device mail client with pre-filled report
    await tryOpenEmailFallback(report, config.supportEmail);
  } catch {
    // Keep error reporting non-blocking.
  }
}

export async function getLastErrorReport(): Promise<ErrorReport | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_ERROR_REPORT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ErrorReport;
  } catch {
    return null;
  }
}

/**
 * Called on every app launch. If a crash saved a report to AsyncStorage but
 * the app died before the webhook could be called, this delivers it now.
 * Clears the stored report after a successful delivery so it isn't re-sent.
 */
export async function flushPendingErrorReport(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(LAST_ERROR_REPORT_KEY);
    if (!raw) return;

    const report = JSON.parse(raw) as ErrorReport;
    const config = readConfig();

    if (config.webhookUrl) {
      try {
        await sendReportToWebhook(report, config.webhookUrl);
        await AsyncStorage.removeItem(LAST_ERROR_REPORT_KEY);
      } catch {
        // Will retry on the next launch.
      }
    }
  } catch {
    // Non-blocking.
  }
}

export function initGlobalErrorReporting(): void {
  if (initialized) return;
  initialized = true;

  const globalObj = global as any;
  const errorUtils = globalObj.ErrorUtils;

  if (!errorUtils?.getGlobalHandler || !errorUtils?.setGlobalHandler) {
    return;
  }

  const previousHandler = errorUtils.getGlobalHandler();

  errorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
    captureErrorReport(error, { source: "global_handler" }, Boolean(isFatal));

    if (typeof previousHandler === "function") {
      previousHandler(error, isFatal);
    }
  });
}
