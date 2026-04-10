import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  ImageBackground,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { forgotPassword } from "../lib/api";
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from "../lib/theme";

const logo  = require("../../assets/logo-square.png");
const heroBg = require("../../assets/hero-bg.png");

type ResetMethod = "membership" | "email" | "username";

const METHODS: { id: ResetMethod; label: string; icon: string }[] = [
  { id: "membership", label: "Membership No.", icon: "card-outline" },
  { id: "email",      label: "Email",          icon: "mail-outline"    },
  { id: "username",   label: "Username",       icon: "person-outline"  },
];

function smartFormatMembershipNo(raw: string, prev: string): string {
  if (
    raw.length < prev.length &&
    /^[A-Z]-$/.test(prev) &&
    /^[A-Z]$/.test(raw)
  ) {
    return "";
  }
  const stripped = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!stripped) return "";
  const letter = stripped[0];
  if (!/[A-Z]/.test(letter)) return "";
  const digits = stripped.slice(1).replace(/\D/g, "");
  return digits ? `${letter}-${digits}` : `${letter}-`;
}

export default function ForgotPasswordScreen() {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const [method, setMethod]   = useState<ResetMethod>("membership");
  const [value, setValue]     = useState("");
  const [prevMemberNo, setPrevMemberNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const handleMethodChange = (m: ResetMethod) => {
    setMethod(m);
    setValue("");
    setPrevMemberNo("");
    setError("");
    setSuccess("");
  };

  const handleMemberNoChange = (raw: string) => {
    const formatted = smartFormatMembershipNo(raw, prevMemberNo);
    setPrevMemberNo(formatted);
    setValue(formatted);
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!value.trim()) {
      const labels: Record<ResetMethod, string> = {
        membership: "membership number",
        email:      "email address",
        username:   "username",
      };
      setError(`Please enter your ${labels[method]}.`);
      return;
    }

    if (method === "membership" && !/^[A-Z]-\d+$/.test(value)) {
      setError("Please enter a valid membership number (e.g. P-1234).");
      return;
    }

    if (method === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const payload =
        method === "membership"
          ? { login_type: "membership" as const, membership_no: value }
          : method === "email"
          ? { login_type: "email" as const, email: value.trim().toLowerCase() }
          : { login_type: "username" as const, username: value.trim() };

      const result = await forgotPassword(payload);
      setSuccess(result.message);
      setValue("");
    } catch (e: any) {
      setError(e.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const placeholder: Record<ResetMethod, string> = {
    membership: "P-1234",
    email:      "your@email.com",
    username:   "Enter your username",
  };

  const icon: Record<ResetMethod, string> = {
    membership: "card-outline",
    email:      "mail-outline",
    username:   "person-outline",
  };

  const keyboardType: Record<ResetMethod, any> = {
    membership: "default",
    email:      "email-address",
    username:   "default",
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* ── Hero ── */}
        <ImageBackground source={heroBg} style={styles.heroBanner} resizeMode="cover">
          <LinearGradient
            colors={["rgba(246,248,247,0)", "rgba(246,248,247,0.6)", "#f6f8f7"]}
            style={styles.heroGradient}
            pointerEvents="none"
          />
          <TouchableOpacity
            style={[styles.backButton, { top: insets.top + 12 }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
        </ImageBackground>

        {/* ── Brand ── */}
        <View style={styles.brandSection}>
          <View style={styles.logoOuter}>
            <Image source={logo} style={styles.logoImage} resizeMode="contain" />
          </View>
          <Text style={styles.pageTitle}>Forgot Password</Text>
          <Text style={styles.pageSubtitle}>
            Enter your membership number, email, or username and we'll send you reset instructions.
          </Text>
        </View>

        {/* ── Form ── */}
        <View style={styles.formArea}>

          {/* ── Method tabs ── */}
          <View style={styles.methodBar}>
            {METHODS.map((m) => {
              const active = m.id === method;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.methodTab, active && styles.methodTabActive]}
                  onPress={() => handleMethodChange(m.id)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={m.icon as any}
                    size={14}
                    color={active ? "#fff" : COLORS.textMuted}
                    style={{ marginBottom: 3 }}
                  />
                  <Text style={[styles.methodTabText, active && styles.methodTabTextActive]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Success banner ── */}
          {!!success && (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
              <View style={{ flex: 1 }}>
                <Text style={styles.successTitle}>Instructions Sent</Text>
                <Text style={styles.successText}>{success}</Text>
              </View>
            </View>
          )}

          {/* ── Error box ── */}
          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* ── Input ── */}
          {!success && (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {method === "membership" ? "MEMBERSHIP NUMBER"
                   : method === "email"    ? "EMAIL ADDRESS"
                   :                         "USERNAME"}
                </Text>
                <View style={styles.fieldRow}>
                  <Ionicons
                    name={icon[method] as any}
                    size={18}
                    color={COLORS.textMuted}
                    style={styles.fieldIcon}
                  />
                  <TextInput
                    style={styles.fieldInput}
                    value={value}
                    onChangeText={method === "membership" ? handleMemberNoChange : setValue}
                    placeholder={placeholder[method]}
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize={method === "email" || method === "username" ? "none" : "characters"}
                    autoCorrect={false}
                    keyboardType={keyboardType[method]}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                    editable={!loading}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, loading && { opacity: 0.65 }]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>SEND RESET INSTRUCTIONS</Text>
                    <Ionicons name="send-outline" size={18} color="#fff" style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* ── Back to sign in ── */}
          <TouchableOpacity
            style={styles.backToSignIn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back-outline" size={15} color={COLORS.primary} />
            <Text style={styles.backToSignInText}>Back to Sign In</Text>
          </TouchableOpacity>

          {/* ── Info card ── */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} style={{ marginTop: 1 }} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.infoTitle}>How it works</Text>
              <Text style={styles.infoText}>
                After submitting, check your registered email or phone for a link or temporary password to regain access to your account.
              </Text>
              <Text style={styles.infoText}>
                If you don't receive anything within a few minutes, please contact GSDCP support.
              </Text>
            </View>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: "#f6f8f7" },

  heroBanner: { width: "100%", height: 200 },
  heroGradient: { position: "absolute", left: 0, right: 0, bottom: 0, height: 200 },
  backButton: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  brandSection: {
    alignItems: "center",
    marginTop: -64,
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  logoOuter: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 4,
    borderColor: COLORS.accent,
    backgroundColor: COLORS.background,
    overflow: "hidden",
    marginBottom: SPACING.md,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  logoImage: { width: 80, height: 80 },
  pageTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
  },

  formArea: { paddingHorizontal: 16 },

  methodBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  methodTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: BORDER_RADIUS.md,
  },
  methodTabActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  methodTabText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  methodTabTextActive: { color: "#fff" },

  successBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#86EFAC",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "700",
    color: "#166534",
    marginBottom: 2,
  },
  successText: {
    fontSize: FONT_SIZES.sm,
    color: "#15803D",
    lineHeight: 20,
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  errorText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    fontWeight: "500",
  },

  fieldGroup: { marginBottom: 18 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  fieldIcon: { marginRight: 10 },
  fieldInput: {
    flex: 1,
    height: 52,
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
  },

  submitBtn: {
    backgroundColor: COLORS.primaryDark ?? COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    height: 56,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    fontSize: FONT_SIZES.md,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1.2,
  },

  backToSignIn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 28,
  },
  backToSignInText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "700",
    color: COLORS.primary,
  },

  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "rgba(15,92,59,0.05)",
    borderWidth: 1,
    borderColor: "rgba(15,92,59,0.12)",
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
  },
  infoTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 2,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
