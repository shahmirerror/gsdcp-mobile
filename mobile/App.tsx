import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet } from "react-native";
import * as Notifications from "expo-notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/contexts/AuthContext";
import { useAppUpdate } from "./src/lib/useAppUpdate";
import { handleNotificationResponse } from "./src/lib/notifications";
import WhatsNewModal from "./src/components/WhatsNewModal";

const splashLogo = require("./assets/splash-logo.png");
const ccmsLogo = require("./assets/ccms-logo.png");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
    },
  },
});

function SplashSequence({ onDone }: { onDone: () => void }) {
  const wrapperOpacity = useRef(new Animated.Value(1)).current;
  const gsdcpOpacity = useRef(new Animated.Value(1)).current;
  const inspediumOpacity = useRef(new Animated.Value(0)).current;

  const logoScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(logoScale, {
      toValue: 1,
      friction: 6,
      tension: 60,
      useNativeDriver: true,
    }).start();

    const crossAt = 3000;
    const crossDur = 400;
    const holdDur = 3000;
    const fadeDur = 400;

    const t1 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(gsdcpOpacity, {
          toValue: 0,
          duration: crossDur,
          useNativeDriver: true,
        }),
        Animated.timing(inspediumOpacity, {
          toValue: 1,
          duration: crossDur,
          useNativeDriver: true,
        }),
      ]).start();
    }, crossAt);

    const t2 = setTimeout(
      () => {
        Animated.timing(wrapperOpacity, {
          toValue: 0,
          duration: fadeDur,
          useNativeDriver: true,
        }).start(onDone);
      },
      crossAt + crossDur + holdDur,
    );

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        s.wrapper,
        { opacity: wrapperOpacity, pointerEvents: "none" as const },
      ]}
    >
      {/* Screen 2 — CCMS logo (underneath) */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          s.screen,
          { opacity: inspediumOpacity },
        ]}
      >
        <Animated.Image
          source={ccmsLogo}
          style={[s.logo, { transform: [{ scale: logoScale }] }]}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Screen 1 — GSDCP content (on top, fades out) */}
      <Animated.View
        style={[StyleSheet.absoluteFill, s.screen, { opacity: gsdcpOpacity }]}
      >
        <Animated.Image
          source={splashLogo}
          style={[s.logo, { transform: [{ scale: logoScale }] }]}
          resizeMode="contain"
        />
      </Animated.View>
    </Animated.View>
  );
}

/**
 * Inner component so hooks run inside all providers.
 */
function AppContent() {
  const [splashDone, setSplashDone] = useState(false);
  const { showWhatsNew, whatsNewVersion, whatsNewChanges, dismissWhatsNew } =
    useAppUpdate();

  // Handle notification taps (foreground + background + killed-state)
  useEffect(() => {
    // Tapped while app was running or backgrounded
    const responseSub = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );

    // Tapped notification that launched the app from killed state
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleNotificationResponse(response);
    });

    return () => responseSub.remove();
  }, []);

  return (
    <>
      <AppNavigator />
      {!splashDone && (
        <SplashSequence onDone={() => setSplashDone(true)} />
      )}
      <WhatsNewModal
        visible={showWhatsNew}
        version={whatsNewVersion}
        changes={whatsNewChanges}
        onDismiss={dismissWhatsNew}
      />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AppContent />
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
