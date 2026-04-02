import { useRef } from "react";
import { Animated, View, StyleSheet, ImageProps } from "react-native";

interface LazyImageProps extends ImageProps {}

export default function LazyImage({ style, onLoad, ...props }: LazyImageProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  const handleLoad = (e: any) => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
    onLoad?.(e);
  };

  return (
    <View style={[styles.placeholder, style]}>
      <Animated.Image
        {...props}
        style={[StyleSheet.absoluteFill, { opacity }]}
        onLoad={handleLoad}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
});
