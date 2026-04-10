import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/contexts/AuthContext";

const splashLogo = require("./assets/splash-logo.png");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
    },
  },
});

function SplashSequence({ onDone }: { onDone: () => void }) {
  const wrapperOpacity  = useRef(new Animated.Value(1)).current;
  const gsdcpOpacity    = useRef(new Animated.Value(1)).current;
  const inspediumOpacity = useRef(new Animated.Value(0)).current;

  const logoScale  = useRef(new Animated.Value(0.88)).current;
  const textFadeY  = useRef(new Animated.Value(14)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(logoScale, {
      toValue: 1,
      friction: 6,
      tension: 60,
      useNativeDriver: true,
    }).start();

    const crossAt  = 3000;
    const crossDur = 400;
    const holdDur  = 3000;
    const fadeDur  = 400;

    const t1 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(gsdcpOpacity,     { toValue: 0, duration: crossDur, useNativeDriver: true }),
        Animated.timing(inspediumOpacity,  { toValue: 1, duration: crossDur, useNativeDriver: true }),
        Animated.timing(textOpacity,       { toValue: 1, duration: crossDur, useNativeDriver: true }),
        Animated.timing(textFadeY,         { toValue: 0, duration: crossDur, useNativeDriver: true }),
      ]).start();
    }, crossAt);

    const t2 = setTimeout(() => {
      Animated.timing(wrapperOpacity, {
        toValue: 0,
        duration: fadeDur,
        useNativeDriver: true,
      }).start(onDone);
    }, crossAt + crossDur + holdDur);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: wrapperOpacity }]} pointerEvents="none">

      {/* Screen 2 — Inspedium (underneath) */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: inspediumOpacity }]}>
        <View style={[s.screen, { backgroundColor: "#FFFFFF" }]}>
          <Animated.View style={{ alignItems: "center", opacity: textOpacity, transform: [{ translateY: textFadeY }] }}>
            <View style={s.badge}>
              <Text style={s.badgeText}>CCMS</Text>
            </View>
            <Text style={s.cmsTitle}>Canine Club{"\n"}Management System</Text>
            <View style={s.divider} />
            <Text style={s.byLine}>by</Text>
            <Text style={s.inspediumName}>Inspedium Corporation</Text>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Screen 1 — GSDCP (on top, fades out) */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: gsdcpOpacity }]}>
        <View style={[s.screen, { backgroundColor: "#FFFFFF" }]}>
          <Animated.Image
            source={splashLogo}
            style={[s.logo, { transform: [{ scale: logoScale }] }]}
            resizeMode="contain"
          />
        </View>
      </Animated.View>

    </Animated.View>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AppNavigator />
            {!splashDone && (
              <SplashSequence onDone={() => setSplashDone(true)} />
            )}
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 240,
    height: 240,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: "#0F5C3A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  badgeText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1,
  },
  cmsTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    lineHeight: 34,
  },
  divider: {
    width: 48,
    height: 2,
    backgroundColor: "#C7A45C",
    borderRadius: 1,
    marginVertical: 16,
  },
  byLine: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 4,
  },
  inspediumName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F5C3A",
    letterSpacing: 0.3,
  },
});
