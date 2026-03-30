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
import { COLORS, BORDER_RADIUS } from "../lib/theme";

const logoSquare = require("../../assets/logo-square.png");

const VISIBLE_TABS = ["DogsTab", "BreedersTab", "HomeTab", "ShowsTab", "ProfileTab"];

const TAB_CONFIG: Record<
  string,
  { label: string; icon: keyof typeof Ionicons.glyphMap; iconFocused: keyof typeof Ionicons.glyphMap }
> = {
  DogsTab: { label: "Dogs", icon: "paw-outline", iconFocused: "paw" },
  BreedersTab: { label: "Active Breeders", icon: "people-outline", iconFocused: "people" },
  HomeTab: { label: "Home", icon: "home-outline", iconFocused: "home" },
  ShowsTab: { label: "Shows", icon: "trophy-outline", iconFocused: "trophy" },
  ProfileTab: { label: "Profile", icon: "person-outline", iconFocused: "person" },
};

const MENU_ITEMS = [
  {
    label: "Kennel\nDirectory",
    icon: "home" as keyof typeof Ionicons.glyphMap,
    route: "KennelDirectoryTab",
    dx: -143,
    dy: -83,
    iconColor: "#fff",
    bg: COLORS.primary,
    border: "#083A24",
  },
  {
    label: "Member\nDirectory",
    icon: "people" as keyof typeof Ionicons.glyphMap,
    route: "MemberDirectoryTab",
    dx: -83,
    dy: -143,
    iconColor: "#fff",
    bg: "#2563EB",
    border: "#1E40AF",
  },
  {
    label: "Recent\nMatings",
    icon: "heart" as keyof typeof Ionicons.glyphMap,
    route: "RecentMatingsTab",
    dx: 83,
    dy: -143,
    iconColor: "#fff",
    bg: "#DC2626",
    border: "#991B1B",
  },
  {
    label: "The\nClub",
    icon: "shield-checkmark" as keyof typeof Ionicons.glyphMap,
    route: "TheClubTab",
    dx: 143,
    dy: -83,
    iconColor: "#fff",
    bg: COLORS.accent,
    border: "#A07C3A",
  },
  {
    label: "Virtual\nBreeding",
    icon: "git-merge" as keyof typeof Ionicons.glyphMap,
    route: "VirtualBreedingTab",
    dx: 0,
    dy: -185,
    iconColor: "#fff",
    bg: "#7C3AED",
    border: "#5B21B6",
  },
];

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
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
          toValue: 1.25,
          duration: 150,
          useNativeDriver: false,
        }),
        Animated.spring(homeScaleAnim, {
          toValue: 1.1,
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

  const effectiveBottomInset = Math.max(insets.bottom, Platform.OS === "android" ? 14 : 0);
  const tabBarHeight = 60 + effectiveBottomInset;
  const homeCenterX = screenWidth / 2;
  const menuBaseY = tabBarHeight + 8;

  const visibleRoutes = state.routes.filter((r) => VISIBLE_TABS.includes(r.name));

  return (
    <>
      <View style={[styles.tabBar, { height: tabBarHeight, paddingBottom: effectiveBottomInset }]}>
        {visibleRoutes.map((route) => {
          const globalIndex = state.routes.findIndex((r) => r.name === route.name);
          const isFocused = state.index === globalIndex;
          const cfg = TAB_CONFIG[route.name];

          const onPress = () => {
            if (route.name === "HomeTab" && menuOpen) {
              closeMenu();
              return;
            }
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name as any);
            }
          };

          if (route.name === "HomeTab") {
            return (
              <Animated.View
                key={route.key}
                style={[styles.tabItem, { transform: [{ scale: homeScaleAnim }] }]}
              >
                <TouchableOpacity
                  style={[styles.homeButton, menuOpen && styles.homeButtonActive]}
                  onPress={onPress}
                  onLongPress={openMenu}
                  delayLongPress={300}
                  activeOpacity={0.85}
                  data-testid="button-home-tab"
                >
                  <Image
                    source={logoSquare}
                    style={[styles.homeLogo, !isFocused && !menuOpen && { opacity: 0.6 }]}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                <Text style={[styles.tabLabel, (isFocused || menuOpen) && styles.tabLabelActive]}>
                  Home
                </Text>
              </Animated.View>
            );
          }

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
                size={23}
                color={isFocused ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {cfg.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal
        visible={menuOpen}
        transparent
        animationType="none"
        onRequestClose={closeMenu}
        statusBarTranslucent
      >
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

        {MENU_ITEMS.map((item, index) => {
          const delay = index * 30;
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
                style={[styles.menuButton, { backgroundColor: item.bg, borderColor: item.border }]}
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

        <View
          style={[
            styles.tabBarOverlay,
            { paddingBottom: effectiveBottomInset, height: tabBarHeight },
          ]}
        >
          {visibleRoutes.map((route) => {
            const globalIndex = state.routes.findIndex((r) => r.name === route.name);
            const isFocused = state.index === globalIndex;
            const cfg = TAB_CONFIG[route.name];

            if (route.name === "HomeTab") {
              return (
                <Animated.View
                  key={route.key}
                  style={[styles.tabItem, { transform: [{ scale: homeScaleAnim }] }]}
                >
                  <TouchableOpacity
                    style={[styles.homeButton, styles.homeButtonActive]}
                    onPress={closeMenu}
                    activeOpacity={0.85}
                  >
                    <Image source={logoSquare} style={styles.homeLogo} resizeMode="contain" />
                  </TouchableOpacity>
                  <Text style={[styles.tabLabel, styles.tabLabelActive]}>Home</Text>
                </Animated.View>
              );
            }

            return (
              <TouchableOpacity
                key={route.key}
                style={styles.tabItem}
                onPress={() => {
                  closeMenu();
                  setTimeout(() => navigation.navigate(route.name as any), 220);
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isFocused ? cfg.iconFocused : cfg.icon}
                  size={23}
                  color={isFocused ? COLORS.primary : COLORS.textMuted}
                />
                <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                  {cfg.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: 60,
    alignItems: "center",
  },
  tabBarOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: "center",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: COLORS.textMuted,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  homeButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  homeButtonActive: {
    backgroundColor: "rgba(15,92,58,0.1)",
  },
  homeLogo: {
    width: 30,
    height: 30,
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
    borderColor: "rgba(255,255,255,0.25)",
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
