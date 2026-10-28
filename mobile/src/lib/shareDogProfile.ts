import type { RefObject, Component } from "react";
import { TurboModuleRegistry, NativeModules } from "react-native";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";

/**
 * Is the react-native-share native module (`RNShare`) actually present in this
 * build? Uses the NON-throwing lookups (`TurboModuleRegistry.get`, not
 * `getEnforcing`, and an optional-chained NativeModules read) so that a build
 * WITHOUT the native module returns false instead of throwing — the throw from
 * `getEnforcing` is what react-native-share runs at import time, and in dev it
 * trips a LogBox redbox even when caught. Gate the require behind this.
 */
function hasNativeShare(): boolean {
  try {
    const viaTurbo =
      typeof TurboModuleRegistry?.get === "function"
        ? TurboModuleRegistry.get("RNShare")
        : null;
    return !!(viaTurbo || NativeModules?.RNShare);
  } catch {
    return false;
  }
}

// Public website base for shareable profile links.
const SITE_ORIGIN = "https://gsdcp.org";

/**
 * Canonical public web link for a dog profile.
 *
 * The web app uses a friendly slug, not an id: `/view_dogs/{foreign_reg_no}-{name}`
 * where only the FIRST space of the name is turned into a hyphen (separating the
 * call name from the kennel) and the rest keep their spaces (URL-encoded). Local
 * dogs have no foreign reg, so the slug begins with a bare "-".
 *   "Winne vom die Besten" (no foreign reg) -> /view_dogs/-Winne-vom%20die%20Besten
 * Verified live against several profiles.
 */
export function dogShareUrl(
  dogName: string,
  foreignRegNo?: string | number | null,
): string {
  const name = String(dogName ?? "").trim();
  // Replace only the first space (call name ↔ kennel separator).
  const slugName = name.replace(" ", "-");
  const prefix = String(foreignRegNo ?? "").trim();
  const slug = `${prefix}-${slugName}`;
  return `${SITE_ORIGIN}/view_dogs/${encodeURIComponent(slug)}`;
}

/**
 * Snapshots the ShareDogCard (1080×1920) to a temporary PNG and returns its uri.
 * The card is captured at its native 1080-wide pixel space, so the output is a
 * crisp, share-ready story image regardless of the on-screen preview scale.
 */
export async function captureCard(
  ref: RefObject<Component | null> | RefObject<any>,
  width = 1080,
  height = 1920,
): Promise<string> {
  return await captureRef(ref as any, {
    format: "png",
    quality: 1,
    width,
    height,
    result: "tmpfile",
  });
}

/** Snapshots the 1080×1920 dog-profile card. */
export async function captureDogCard(
  ref: RefObject<Component | null> | RefObject<any>,
): Promise<string> {
  return captureCard(ref, 1080, 1920);
}

/**
 * Opens the native share sheet for a generated image file.
 * Returns false if sharing isn't available on this platform.
 */
export async function shareImage(
  uri: string,
  dialogTitle = "Share dog profile",
): Promise<boolean> {
  const available = await Sharing.isAvailableAsync();
  if (!available) return false;
  await Sharing.shareAsync(uri, {
    mimeType: "image/png",
    dialogTitle,
    UTI: "public.png",
  });
  return true;
}

/**
 * Shares the generated card image together with the profile deep link, so the
 * recipient gets the picture AND a tappable gsdcp.org/view_dogs link that opens
 * the app (Universal/App Links). This needs `react-native-share` (a native
 * module); if it isn't available in the current build it falls back to sharing
 * the image on its own via expo-sharing, so the feature degrades gracefully.
 */
export async function shareImageWithLink(
  uri: string,
  link: string,
  opts: { title?: string; message?: string } = {},
): Promise<boolean> {
  const title = opts.title ?? "Share dog profile";
  const message = opts.message ? `${opts.message}\n${link}` : link;

  // Only touch react-native-share when its native module is really in the build.
  // Requiring it otherwise runs `getEnforcing('RNShare')` at module load, which
  // throws and (in dev) trips a LogBox redbox even though we'd catch it.
  if (hasNativeShare()) {
    try {
      const Share = require("react-native-share").default;
      await Share.open({
        title,
        message,
        url: uri, // local file:// png — attached alongside the text/link
        type: "image/png",
        failOnCancel: false,
      });
      return true;
    } catch {
      // fall through to image-only sharing below
    }
  }

  // No native react-native-share (e.g. current dev client / JS-only OTA):
  // share the image on its own via expo-sharing.
  return shareImage(uri, title);
}

/** Copies the profile link to the clipboard. */
export async function copyProfileLink(url: string): Promise<void> {
  await Clipboard.setStringAsync(url);
}
