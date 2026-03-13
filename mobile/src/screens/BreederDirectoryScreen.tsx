import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZES } from "../lib/theme";

export default function BreederDirectoryScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="people-outline" size={64} color={COLORS.textMuted} />
      <Text style={styles.title}>Breeder Directory</Text>
      <Text style={styles.desc}>Breeder listings will appear here once the API endpoint is available.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "600",
    color: COLORS.text,
  },
  desc: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: "center",
  },
});
