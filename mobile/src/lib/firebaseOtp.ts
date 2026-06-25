import { getApp } from "@react-native-firebase/app";
import { getAuth, signInWithPhoneNumber } from "@react-native-firebase/auth";

/**
 * Minimal shape the UI relies on. Both the native (this file) and the web
 * override (firebaseOtp.web.ts) return something that satisfies this, so the
 * login screen can stay platform-agnostic.
 */
export type OtpConfirmation = {
  confirm: (code: string) => Promise<unknown>;
};

/**
 * Native (Android/iOS) OTP sender — uses Firebase Phone Auth via the native
 * @react-native-firebase module. On Android, verification is handled silently
 * by Play Integrity (falling back to reCAPTCHA) so NO DOM/recaptcha element is
 * needed; on iOS it uses APNs silent push / reCAPTCHA fallback.
 *
 * `phoneE164` must be in E.164 format, e.g. "+923001234567".
 * The returned object's `confirm(code)` completes verification with the SMS code.
 */
export async function sendOtp(phoneE164: string): Promise<OtpConfirmation> {
  const auth = getAuth(getApp());
  return signInWithPhoneNumber(auth, phoneE164);
}
