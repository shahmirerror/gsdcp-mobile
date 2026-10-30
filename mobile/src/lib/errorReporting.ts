import { Linking, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import Constants from "expo-constants";

// Legacy single-report key (pre-queue). Kept so a report saved by an older
// build is migrated into the queue on the first launch after this update.
const LEGACY_LAST_ERROR_REPORT_KEY = "@gsdcp/last_error_report";
// New durable queue of reports awaiting successful delivery.
const ERROR_REPORT_QUEUE_KEY = "@gsdcp/error_report_queue";
const AUTH_STORAGE_KEY = "gsdcp_auth_user";

// Keep the queue bounded so a device that is offline for a long time (or a
// tight crash loop) can't grow AsyncStorage without limit. Oldest reports are
// dropped first once the cap is hit.
const MAX_QUEUED_REPORTS = 25;
// Abort a webhook POST that hasn't responded in time, so a hanging request
// never blocks launch flushing or the global handler.
const WEBHOOK_TIMEOUT_MS = 10000;

type ErrorReport = {
  id: string;
  app: {
    name: string;
    version: string;
    runtimeVersion: string | null;
    releaseChannel: string | null;
    platform: string;
  };
  environment: {
    // false for release/production installs, true for dev-client / __DEV__ bundles.
    isDev: boolean;
    // "standalone" | "storeClient" | "bare" — distinguishes a real store install.
    executionEnvironment: string | null;
    appOwnership: string | null;
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

function makeReportId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
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
    id: makeReportId(),
    app: {
      name: Constants.expoConfig?.name ?? "GSDCP",
      version: Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "unknown",
      runtimeVersion: Constants.expoConfig?.runtimeVersion
        ? String(Constants.expoConfig.runtimeVersion)
        : null,
      releaseChannel: (Constants.expoConfig?.updates as any)?.channel ?? null,
      platform: Platform.OS,
    },
    environment: {
      isDev: typeof __DEV__ !== "undefined" ? Boolean(__DEV__) : false,
      executionEnvironment: (Constants as any)?.executionEnvironment ?? null,
      appOwnership: Constants.appOwnership ?? null,
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

/* ── Durable queue ──────────────────────────────────────────────────────────
 * Every captured crash is appended to a queue in AsyncStorage before we try to
 * deliver it. Delivery removes it from the queue; a failure leaves it there to
 * be retried on the next launch (or the next crash). This guarantees a crash is
 * never silently lost just because the network blipped or a second crash landed
 * before the first was delivered.
 * ---------------------------------------------------------------------------*/

async function readQueue(): Promise<ErrorReport[]> {
  try {
    const raw = await AsyncStorage.getItem(ERROR_REPORT_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ErrorReport[]) : [];
  } catch {
    return [];
  }
}

async function writeQueue(reports: ErrorReport[]): Promise<void> {
  try {
    // Keep only the newest MAX_QUEUED_REPORTS entries.
    const trimmed = reports.slice(-MAX_QUEUED_REPORTS);
    await AsyncStorage.setItem(ERROR_REPORT_QUEUE_KEY, JSON.stringify(trimmed));
  } catch {
    // Non-blocking; a failed persist just means we may lose this report.
  }
}

async function enqueueReport(report: ErrorReport): Promise<void> {
  const queue = await readQueue();
  queue.push(report);
  await writeQueue(queue);
}

/**
 * One-time migration: fold any report saved by a pre-queue build into the queue
 * so it still gets delivered, then drop the legacy key.
 */
async function migrateLegacyReport(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(LEGACY_LAST_ERROR_REPORT_KEY);
    if (!raw) return;
    const legacy = JSON.parse(raw) as Partial<ErrorReport>;
    const queue = await readQueue();
    queue.push({
      ...(legacy as ErrorReport),
      id: legacy?.id ?? makeReportId(),
    });
    await writeQueue(queue);
    await AsyncStorage.removeItem(LEGACY_LAST_ERROR_REPORT_KEY);
  } catch {
    // Ignore — a malformed legacy entry shouldn't block anything.
  }
}

async function sendReportToWebhook(report: ErrorReport, webhookUrl: string): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(report),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`error_report_webhook_failed_${res.status}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Attempts to deliver every queued report, removing each one only after the
 * webhook accepts it. Reports that fail stay queued for the next attempt.
 * Returns the number of reports still undelivered.
 */
async function flushQueue(): Promise<number> {
  const config = readConfig();
  if (!config.webhookUrl) return (await readQueue()).length;

  const queue = await readQueue();
  if (queue.length === 0) return 0;

  const remaining: ErrorReport[] = [];
  for (const report of queue) {
    try {
      await sendReportToWebhook(report, config.webhookUrl);
      // Delivered — do not re-queue.
    } catch {
      remaining.push(report);
    }
  }
  await writeQueue(remaining);
  return remaining.length;
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
    `Environment: ${report.environment.isDev ? "development" : "production"} (${report.environment.executionEnvironment ?? "n/a"})`,
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

/**
 * Captures a crash/error: builds a report, persists it to the durable queue,
 * then tries to deliver everything currently queued.
 *
 * The report is queued *before* delivery is attempted, so even if the webhook
 * fails — or the app is torn down by a fatal crash mid-request — the report is
 * retried on the next launch instead of being lost.
 */
export async function captureErrorReport(
  error: unknown,
  context: Record<string, unknown> = {},
  isFatal = false,
): Promise<void> {
  try {
    const report = await buildErrorReport(error, context, isFatal);
    const config = readConfig();

    await enqueueReport(report);

    if (config.webhookUrl) {
      // Deliver this and any previously-stuck reports.
      await flushQueue();
      return;
    }

    // No backend configured: fall back to the device mail client so the report
    // isn't stranded. (With a webhook set we never hijack the user's mail app —
    // the queue + launch retry handles delivery instead.)
    await tryOpenEmailFallback(report, config.supportEmail);
  } catch {
    // Keep error reporting non-blocking.
  }
}

/**
 * Public helper for capturing a handled (non-fatal) error from a catch block,
 * e.g. `logHandledError(e, { screen: "VirtualBreeding" })`. Useful for surfacing
 * failures that are caught in the UI but still worth knowing about in production.
 */
export function logHandledError(
  error: unknown,
  context: Record<string, unknown> = {},
): void {
  void captureErrorReport(error, { ...context, handled: true }, false);
}

export async function getLastErrorReport(): Promise<ErrorReport | null> {
  try {
    const queue = await readQueue();
    return queue.length > 0 ? queue[queue.length - 1] : null;
  } catch {
    return null;
  }
}

/**
 * Called on every app launch. Migrates any legacy single-report, then delivers
 * every report still queued from a prior session (crashes that died before the
 * webhook could confirm delivery). Anything that fails stays queued for the
 * next launch.
 */
export async function flushPendingErrorReport(): Promise<void> {
  try {
    await migrateLegacyReport();
    await flushQueue();
  } catch {
    // Non-blocking.
  }
}

/**
 * Enables capture of unhandled promise rejections (async errors that never hit
 * the synchronous global handler). Best-effort: guarded so a missing/renamed
 * module can never break app startup.
 */
function initUnhandledRejectionCapture(): void {
  try {
    // Ships with React Native via the `promise` polyfill.
    const rejectionTracking = require("promise/setimmediate/rejection-tracking");
    rejectionTracking.enable({
      allRejections: true,
      onUnhandled: (_id: unknown, error: unknown) => {
        void captureErrorReport(error, { source: "unhandled_rejection" }, false);
      },
      onHandled: () => {
        // A previously-unhandled rejection was later handled; nothing to report.
      },
    });
  } catch {
    // Rejection tracking unavailable on this runtime — skip silently.
  }
}

export function initGlobalErrorReporting(): void {
  if (initialized) return;
  initialized = true;

  initUnhandledRejectionCapture();

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
