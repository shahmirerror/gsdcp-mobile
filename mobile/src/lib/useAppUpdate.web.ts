/**
 * Web has no native app-store update flow. This no-op web variant exists so
 * Metro resolves `useAppUpdate` here on web and never bundles
 * `sp-react-native-in-app-updates` (a native-only module with no web build,
 * which otherwise fails to resolve and breaks the entire web bundle).
 */
export function useAppUpdate(): void {}
