import { useEffect, useRef, useState } from "react";
import { View, Image, StyleSheet, Animated, Dimensions } from "react-native";

const logoSquare = require("../../assets/logo-square.png");
const { width, height } = Dimensions.get("window");

const DURATION_IN = 200;
const DURATION_OUT = 350;

export function SplashTransition({ visible }: { visible: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: DURATION_IN, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: DURATION_IN, useNativeDriver: true }),
      ]).start();
    } else if (show) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: DURATION_OUT, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.1, duration: DURATION_OUT, useNativeDriver: true }),
      ]).start(() => {
        setShow(false);
        scale.setValue(0.8);
      });
    }
  }, [visible]);

  if (!show) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity }]} pointerEvents="none">
      <Animated.View style={{ transform: [{ scale }] }}>
        <Image source={logoSquare} style={styles.logo} resizeMode="contain" />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 92, 58, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  logo: {
    width: 80,
    height: 80,
  },
});
