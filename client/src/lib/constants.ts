export const COLORS = {
  primary: "#0F5C3A",
  darkGreen: "#083A24",
  accentGold: "#C7A45C",
  background: "#F5F5F2",
  white: "#FFFFFF",
  black: "#000000",
} as const;

export const SPACING = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
} as const;

export const APP_CONFIG = {
  appName: "GSDCP",
  appFullName: "German Shepherd Dog Club of Pakistan",
  version: "1.0.0",
} as const;

export const NAV_ITEMS = [
  { label: "Home", path: "/", icon: "Home" },
  { label: "Dogs", path: "/dogs", icon: "Search" },
  { label: "Breeders", path: "/breeders", icon: "Users" },
  { label: "Shows", path: "/shows", icon: "Trophy" },
  { label: "Profile", path: "/profile", icon: "User" },
] as const;
