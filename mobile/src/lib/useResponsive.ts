import { useWindowDimensions } from "react-native";

/**
 * Screen-size helper for tablet/large-screen layouts. Backed by
 * useWindowDimensions so it re-renders on rotation and split-screen resize
 * (unlike a module-level Dimensions.get snapshot).
 */
export type Responsive = {
  width: number;
  height: number;
  /** ≥ 700dp — tablets and large foldables (portrait included). */
  isTablet: boolean;
  /** ≥ 1000dp — landscape tablets / very wide windows. */
  isWide: boolean;
  /** Cap so content columns don't stretch uncomfortably wide. */
  contentMaxWidth: number;
};

export const TABLET_BREAKPOINT = 700;
export const WIDE_BREAKPOINT = 1000;

export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();
  return {
    width,
    height,
    isTablet: width >= TABLET_BREAKPOINT,
    isWide: width >= WIDE_BREAKPOINT,
    contentMaxWidth: 1040,
  };
}
