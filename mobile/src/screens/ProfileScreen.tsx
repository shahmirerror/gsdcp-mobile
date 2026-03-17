import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from "../lib/theme";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.header}>Profile</Text>

      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={36} color={COLORS.primary} />
        </View>
        <Text style={styles.name}>Guest User</Text>
        <Text style={styles.email}>Sign in to access your profile</Text>
      </View>

      <View style={styles.card}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("LoginRegister")} data-testid="button-sign-in">
          <View style={[styles.menuIconWrap, { backgroundColor: "rgba(15,92,58,0.08)" }]}>
            <Ionicons name="log-in-outline" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.menuLabel}>Sign In / Register</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
        <View style={styles.menuDivider} />
        <TouchableOpacity style={styles.menuItem} data-testid="button-my-dogs">
          <View style={[styles.menuIconWrap, { backgroundColor: "rgba(59,130,246,0.08)" }]}>
            <Ionicons name="paw-outline" size={20} color="#3B82F6" />
          </View>
          <Text style={styles.menuLabel}>My Dogs</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
        <View style={styles.menuDivider} />
        <TouchableOpacity style={styles.menuItem} data-testid="button-settings">
          <View style={[styles.menuIconWrap, { backgroundColor: "rgba(139,92,246,0.08)" }]}>
            <Ionicons name="settings-outline" size={20} color="#8B5CF6" />
          </View>
          <Text style={styles.menuLabel}>Settings</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
        <View style={styles.menuDivider} />
        <TouchableOpacity style={styles.menuItem} data-testid="button-about">
          <View style={[styles.menuIconWrap, { backgroundColor: "rgba(199,164,92,0.08)" }]}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.accent} />
          </View>
          <Text style={styles.menuLabel}>About GSDCP</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>GSDCP v1.0.0</Text>
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
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  avatarSection: {
    alignItems: "center",
    marginVertical: SPACING.xl,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(15,92,58,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  name: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "700",
    color: COLORS.text,
  },
  email: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: FONT_SIZES.lg,
    fontWeight: "500",
    color: COLORS.text,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 68,
  },
  version: {
    textAlign: "center",
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xl,
  },
});
