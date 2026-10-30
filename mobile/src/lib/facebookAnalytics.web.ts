/**
 * Web stub for facebookAnalytics. The Meta SDK (react-native-fbsdk-next) is a
 * native-only module, so on web (react-native-web) Metro resolves this file
 * instead of facebookAnalytics.ts and never bundles the native package.
 * Every export is a no-op with the same signature as the native module.
 */

export function initFacebookAnalytics(): void {}

export function logFacebookEvent(
  _eventName: string,
  _params?: Record<string, string | number>,
): void {}

export function logFacebookPurchase(
  _amount: number,
  _currency: string,
  _params?: Record<string, string | number>,
): void {}

export function setFacebookUserId(_userId: string | null): void {}
