import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from "../lib/theme";
import { useAuth } from "../contexts/AuthContext";

interface LockedRecordProps {
  /** What is being locked, e.g. "DNA & HD/ED records". Shown in the message. */
  title: string;
  /** Called when a signed-out viewer taps "Sign In". Omit to hide the button. */
  onSignIn?: () => void;
  /** Tighter padding for use inside an existing card. */
  compact?: boolean;
  style?: object;
}

/**
 * Placeholder shown in place of Club-Members-only information (DNA, HD/ED).
 * The content it guards is only rendered once {@link useAuth}'s `isClubMember`
 * gate is true — an active, signed-in club member. This component renders the
 * locked state and tailors its message to why the viewer can't see it yet:
 *   • signed out            → invite to sign in
 *   • signed in, not active → explain an active membership is required
 */
export default function LockedRecord({ title, onSignIn, compact, style }: LockedRecordProps) {
  const { isLoggedIn } = useAuth();

  const message = isLoggedIn
    ? `${title} are available to active club members. Your membership isn't active yet.`
    : `${title} are available to club members only. Sign in with an active membership to view them.`;

  return (
    <View style={[styles.container, compact && styles.containerCompact, style]}>
      <View style={styles.iconWrap}>
        <Ionicons name="lock-closed" size={22} color={COLORS.primary} />
      </View>
      <Text style={styles.title}>Club Members Only</Text>
      <Text style={styles.message}>{message}</Text>
      {!isLoggedIn && onSignIn && (
        <TouchableOpacity
          style={styles.button}
          onPress={onSignIn}
          activeOpacity={0.8}
          data-testid="btn-locked-signin"
        >
          <Ionicons name="log-in-outline" size={16} color="#fff" />
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xs,
  },
  containerCompact: {
    paddingVertical: SPACING.lg,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(15,92,58,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "700",
    color: COLORS.text,
  },
  message: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 320,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: FONT_SIZES.sm,
  },
});
