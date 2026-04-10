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

const gsdcpLogo = require("./assets/logo-square.png");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
    },
  },
});

type SplashPhase = "gsdcp" | "inspedium" | "done";

function GSDCPSplash() {
  const scale = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 6,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={[splash.container, { backgroundColor: "#0F5C3A" }]}>
      <Animated.View style={{ transform: [{ scale }], alignItems: "center" }}>
        <Image source={gsdcpLogo} style={splash.gsdcpLogo} resizeMode="contain" />
      </Animated.View>
    </View>
  );
}

function InspediumSplash() {
  const fadeText = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeText, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideY, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[splash.container, { backgroundColor: "#FFFFFF" }]}>
      <Animated.View
        style={{ alignItems: "center", opacity: fadeText, transform: [{ translateY: slideY }] }}
      >
        <View style={splash.inspediumBadge}>
          <Text style={splash.inspediumBadgeText}>CCMS</Text>
        </View>
        <Text style={splash.cmsTitle}>Canine Club{"\n"}Management System</Text>
        <View style={splash.divider} />
        <Text style={splash.byLine}>by</Text>
        <Text style={splash.inspediumName}>Inspedium Corporation</Text>
      </Animated.View>
    </View>
  );
}

export default function App() {
  const [splashPhase, setSplashPhase] = useState<SplashPhase>("gsdcp");
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (splashPhase === "done") return;

    const holdMs = 2300;
    const fadeMs = 400;

    const timeout = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: fadeMs,
        useNativeDriver: true,
      }).start(() => {
        if (splashPhase === "gsdcp") {
          fadeAnim.setValue(1);
          setSplashPhase("inspedium");
        } else {
          setSplashPhase("done");
        }
      });
    }, holdMs);

    return () => clearTimeout(timeout);
  }, [splashPhase]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AppNavigator />
            {splashPhase !== "done" && (
              <Animated.View
                style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}
                pointerEvents="none"
              >
                {splashPhase === "gsdcp" ? <GSDCPSplash /> : <InspediumSplash />}
              </Animated.View>
            )}
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const splash = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  gsdcpLogo: {
    width: 220,
    height: 220,
  },
  inspediumBadge: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: "#0F5C3A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  inspediumBadgeText: {
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
