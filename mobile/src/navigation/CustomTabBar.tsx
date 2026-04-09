import { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Pressable,
  StyleSheet,
  Image,
  Modal,
  useWindowDimensions,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../lib/theme";

const logoSquare = require("../../assets/logo-square.png");

const VISIBLE_TABS = [
  "DogsTab",
  "BreedersTab",
  "HomeTab",
  "ShowsTab",
  "ProfileTab",
];

const TAB_ROOT_SCREENS: Record<string, string> = {
  DogsTab: "DogSearch",
  BreedersTab: "BreederDirectory",
  ShowsTab: "ShowsList",
  ProfileTab: "ProfileHome",
};

const TAB_CONFIG: Record<
  string,
  {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconFocused: keyof typeof Ionicons.glyphMap;
  }
> = {
  DogsTab: { label: "Dogs", icon: "paw-outline", iconFocused: "paw" },
  BreedersTab: {
    label: "Breeders",
    icon: "people-outline",
    iconFocused: "people",
  },
  HomeTab: { label: "Home", icon: "home-outline", iconFocused: "home" },
  ShowsTab: { label: "Shows", icon: "trophy-outline", iconFocused: "trophy" },
  ProfileTab: {
    label: "Profile",
    icon: "person-outline",
    iconFocused: "person",
  },
};

const MENU_ITEMS = [
  {
    label: "Kennel\nDirectory",
    icon: "home" as keyof typeof Ionicons.glyphMap,
    route: "KennelDirectoryTab",
    dx: -143,
    dy: -83,
    iconColor: COLORS.primary,
    bg: COLORS.background,
    border: COLORS.primary,
  },
  {
    label: "Member\nDirectory",
    icon: "people" as keyof typeof Ionicons.glyphMap,
    route: "MemberDirectoryTab",
    dx: -83,
    dy: -143,
    iconColor: COLORS.primary,
    bg: COLORS.background,
    border: COLORS.primary,
  },
  {
    label: "Recent\nMatings",
    icon: "heart" as keyof typeof Ionicons.glyphMap,
    route: "RecentMatingsTab",
    dx: 83,
    dy: -143,
    iconColor: COLORS.primary,
    bg: COLORS.background,
    border: COLORS.primary,
  },
  {
    label: "The\nClub",
    icon: "shield-checkmark" as keyof typeof Ionicons.glyphMap,
    route: "TheClubTab",
    dx: 143,
    dy: -83,
    iconColor: COLORS.primary,
    bg: COLORS.background,
    border: COLORS.primary,
  },
  {
    label: "Virtual\nBreeding",
    icon: "git-merge" as keyof typeof Ionicons.glyphMap,
    route: "VirtualBreedingTab",
    dx: 0,
    dy: -185,
    iconColor: COLORS.primary,
    bg: COLORS.background,
    border: COLORS.primary,
  },
];

const HOME_BTN_SIZE = 58;
const BAR_HEIGHT = 62;
const PROTRUDE = 20; // px the home button rises above the bar

export default function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [menuOpen, setMenuOpen] = useState(false);
  const animValue = useRef(new Animated.Value(0)).current;
  const homeScaleAnim = useRef(new Animated.Value(1)).current;

  const openMenu = () => {
    setMenuOpen(true);
    Animated.parallel([
      Animated.spring(animValue, {
        toValue: 1,
        useNativeDriver: false,
        tension: 60,
        friction: 8,
      }),
      Animated.sequence([
        Animated.timing(homeScaleAnim, {
          toValue: 1.2,
          duration: 140,
          useNativeDriver: false,
        }),
        Animated.spring(homeScaleAnim, {
          toValue: 1.08,
          useNativeDriver: false,
          tension: 80,
          friction: 5,
        }),
      ]),
    ]).start();
  };

  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(animValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.spring(homeScaleAnim, {
        toValue: 1,
        useNativeDriver: false,
        tension: 80,
        friction: 6,
      }),
    ]).start(() => setMenuOpen(false));
  };

  const handleMenuItemPress = (route: string) => {
    closeMenu();
    setTimeout(() => navigation.navigate(route as any), 220);
  };

  const visibleRoutes = state.routes.filter((r) =>
    VISIBLE_TABS.includes(r.name),
  );
  const leftRoutes = visibleRoutes.slice(0, 2);
  const homeRoute = visibleRoutes[2];
  const rightRoutes = visibleRoutes.slice(3);

  const homeGlobalIdx = state.routes.findIndex((r) => r.name === "HomeTab");
  const homeIsFocused = state.index === homeGlobalIdx;

  const menuBaseY = BAR_HEIGHT + insets.bottom + PROTRUDE + 16;

  const homeCenterX = screenWidth / 2;

  const renderSideTab = (
    route: (typeof visibleRoutes)[0],
    closeFirst = false,
  ) => {
    const globalIndex = state.routes.findIndex((r) => r.name === route.name);
    const isFocused = state.index === globalIndex;
    const cfg = TAB_CONFIG[route.name];

    const onPress = () => {
      if (closeFirst) {
        closeMenu();
        setTimeout(() => navigation.navigate(route.name as any), 220);
        return;
      }
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });
      if (!event.defaultPrevented) {
        if (isFocused && TAB_ROOT_SCREENS[route.name]) {
          navigation.navigate(route.name as any, {
            screen: TAB_ROOT_SCREENS[route.name],
          });
        } else if (!isFocused) {
          navigation.navigate(route.name as any);
        }
      }
    };

    return (
      <TouchableOpacity
        key={route.key}
        style={styles.tabItem}
        onPress={onPress}
        activeOpacity={0.7}
        data-testid={`button-tab-${route.name.toLowerCase()}`}
      >
        <Ionicons
          name={isFocused ? cfg.iconFocused : cfg.icon}
          size={24}
          color={isFocused ? COLORS.primary : COLORS.textMuted}
        />
        <Text style={isFocused ? styles.tabLabelActive : styles.tabLabelMuted}>
          {cfg.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderHomeBtn = (isOverlay = false) => {
    const active = isOverlay ? true : homeIsFocused || menuOpen;
    return (
      <Animated.View
        style={[styles.homeBtnWrap, { transform: [{ scale: homeScaleAnim }] }]}
      >
        <TouchableOpacity
          style={[styles.homeBtn, active && styles.homeBtnActive]}
          onPress={() => {
            if (isOverlay) {
              closeMenu();
              return;
            }
            if (menuOpen) {
              closeMenu();
              return;
            }
            const event = navigation.emit({
              type: "tabPress",
              target: homeRoute.key,
              canPreventDefault: true,
            });
            if (!event.defaultPrevented) {
              navigation.navigate(homeRoute.name as any);
            }
          }}
          onLongPress={isOverlay ? undefined : openMenu}
          delayLongPress={300}
          activeOpacity={0.85}
          data-testid="button-home-tab"
        >
          <Image
            source={logoSquare}
            style={[styles.homeLogo, !active && { opacity: 0.65 }]}
            resizeMode="contain"
          />
        </TouchableOpacity>
        {!isOverlay && !menuOpen && (
          <Text style={styles.holdHint}>Press & Hold</Text>
        )}
      </Animated.View>
    );
  };

  const wrapperPaddingBottom = insets.bottom + 8;

  return (
    <>
      {/* ── Main floating tab bar ─────────────────────────────── */}
      <View style={[styles.wrapper, { paddingBottom: wrapperPaddingBottom }]}>
        {/* White pill card */}
        <View style={styles.tabRow}>
          {leftRoutes.map((r) => renderSideTab(r))}
          <View style={styles.centerSpacer} />
          {rightRoutes.map((r) => renderSideTab(r))}
        </View>

        {/* Home button — protrudes above the pill */}
        {renderHomeBtn(false)}
      </View>

      {/* ── Menu radial overlay ──────────────────────────────── */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="none"
        onRequestClose={closeMenu}
        statusBarTranslucent
      >
        {/* Dim backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.6],
              }),
            },
          ]}
          pointerEvents="none"
        />
        <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />

        {/* Radial menu items */}
        {MENU_ITEMS.map((item, index) => {
          const translateX = animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, item.dx],
          });
          const translateY = animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, item.dy],
          });
          const opacity = animValue.interpolate({
            inputRange: [0, 0.4, 1],
            outputRange: [0, 0.6, 1],
          });
          const scale = animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.4, 1],
          });

          return (
            <Animated.View
              key={item.route}
              style={[
                styles.menuItemWrap,
                {
                  bottom: menuBaseY,
                  left: homeCenterX - 30,
                  opacity,
                  transform: [{ translateX }, { translateY }, { scale }],
                },
              ]}
              pointerEvents="box-none"
            >
              <TouchableOpacity
                style={[
                  styles.menuButton,
                  { backgroundColor: item.bg, borderColor: item.border },
                ]}
                onPress={() => handleMenuItemPress(item.route)}
                activeOpacity={0.8}
                data-testid={`button-menu-${item.route.toLowerCase()}`}
              >
                <Ionicons name={item.icon} size={24} color={item.iconColor} />
              </TouchableOpacity>
              <Text style={styles.menuLabel} numberOfLines={2}>
                {item.label}
              </Text>
            </Animated.View>
          );
        })}

        {/* Tab bar replica at bottom so the bar stays visible during menu */}
        <View
          style={[
            styles.overlayWrapper,
            { paddingBottom: wrapperPaddingBottom },
          ]}
        >
          <View style={styles.tabRow}>
            {leftRoutes.map((r) => renderSideTab(r, true))}
            <View style={styles.centerSpacer} />
            {rightRoutes.map((r) => renderSideTab(r, true))}
          </View>
          {renderHomeBtn(true)}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: COLORS.background,
  },
  overlayWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: COLORS.background,
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    height: BAR_HEIGHT,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 12,
  },
  centerSpacer: {
    width: HOME_BTN_SIZE + 16,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 8,
    minHeight: BAR_HEIGHT,
  },
  tabLabelActive: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.primary,
    marginTop: 1,
  },
  tabLabelMuted: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginTop: 1,
  },
  homeBtnWrap: {
    position: "absolute",
    top: -PROTRUDE,
    left: 0,
    right: 0,
    alignItems: "center",
    pointerEvents: "box-none",
  },
  homeBtn: {
    width: HOME_BTN_SIZE,
    height: HOME_BTN_SIZE,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 14,
  },
  homeBtnActive: {
    backgroundColor: COLORS.background,
  },
  homeLogo: {
    width: 32,
    height: 32,
  },
  holdHint: {
    fontSize: 9,
    fontWeight: "600",
    color: COLORS.textMuted,
    letterSpacing: 0.2,
    marginTop: 10,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  menuItemWrap: {
    position: "absolute",
    alignItems: "center",
    width: 60,
  },
  menuButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
  },
  menuLabel: {
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 7,
    lineHeight: 14,
    color: "#fff",
    letterSpacing: 0.2,
  },
});
