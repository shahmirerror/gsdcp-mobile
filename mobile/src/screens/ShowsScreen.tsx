import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from "../lib/theme";

export default function ShowsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.header}>Shows</Text>
      <View style={styles.emptyCard}>
        <View style={styles.iconWrap}>
          <Ionicons name="trophy-outline" size={40} color={COLORS.accent} />
        </View>
        <Text style={styles.title}>Dog Shows & Events</Text>
        <Text style={styles.desc}>
          Show listings and results will appear here once the API endpoint is available.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  header: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: SPACING.lg,
    marginTop: SPACING.sm,
  },
  emptyCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "rgba(199,164,92,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  desc: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});
