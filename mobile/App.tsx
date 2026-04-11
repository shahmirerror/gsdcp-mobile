import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  StyleSheet,
} from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/contexts/AuthContext";

const splashLogo  = require("./assets/splash-logo.png");
const ccmsLogo    = require("./assets/ccms-logo.png");

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

  const logoScale = useRef(new Animated.Value(0.88)).current;

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
        Animated.timing(gsdcpOpacity,    { toValue: 0, duration: crossDur, useNativeDriver: true }),
        Animated.timing(inspediumOpacity, { toValue: 1, duration: crossDur, useNativeDriver: true }),
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
    <Animated.View style={[StyleSheet.absoluteFill, s.wrapper, { opacity: wrapperOpacity, pointerEvents: "none" as const }]}>

      {/* Screen 2 — CCMS logo (underneath) */}
      <Animated.View style={[StyleSheet.absoluteFill, s.screen, { opacity: inspediumOpacity }]}>
        <Image
          source={ccmsLogo}
          style={s.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Screen 1 — GSDCP content (on top, fades out) */}
      <Animated.View style={[StyleSheet.absoluteFill, s.screen, { opacity: gsdcpOpacity }]}>
        <Animated.Image
          source={splashLogo}
          style={[s.logo, { transform: [{ scale: logoScale }] }]}
          resizeMode="contain"
        />
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
  wrapper: {
    backgroundColor: "#FFFFFF",
  },
  screen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 240,
    height: 240,
  },
});
