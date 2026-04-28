import { createNavigationContainerRef } from "@react-navigation/native";

/**
 * A module-level navigation ref so that code outside the React tree
 * (e.g. notification handlers) can trigger navigation.
 *
 * Always guard calls with `navigationRef.isReady()`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const navigationRef = createNavigationContainerRef<any>();
