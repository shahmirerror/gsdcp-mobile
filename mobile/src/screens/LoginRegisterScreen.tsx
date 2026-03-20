import { useState, useRef } from "react";
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
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from "../lib/theme";
import { useAuth } from "../contexts/AuthContext";

const logo = require("../../assets/logo-square.png");
const heroBg = require("../../assets/hero-bg.jpg");

export default function LoginRegisterScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    setError("");
    if (!identifier.trim()) { setError("Please enter your email or membership ID"); return; }
    if (!password) { setError("Please enter your password"); return; }
    setLoading(true);
    try {
      await login(identifier.trim(), password);
      navigation.goBack();
    } catch (e: any) {
      setError(e.message ?? "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
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
        {/* ── Hero — exact same pattern as DogProfile / MemberProfile ── */}
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
            data-testid="btn-back"
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
        </ImageBackground>

        {/* ── Brand — sits at marginTop:-80, matching the avatar/profileSection pattern ── */}
        <View style={styles.brandSection}>
          <View style={styles.logoOuter}>
            <Image source={logo} style={styles.logoImage} resizeMode="contain" />
          </View>
          <Text style={styles.clubTitle}>GSDCP</Text>
          <Text style={styles.clubSubtitle}>GERMAN SHEPHERD DOG CLUB OF PAKISTAN</Text>
          <Text style={styles.clubTagline}>
            Preserving the standard of the breed since 1978
          </Text>
        </View>

        {/* ── Form ── */}
        <View style={styles.formArea}>
          <Text style={styles.formTitle}>Member Sign In</Text>
          <Text style={styles.formSub}>Access your kennel, pedigrees & show records.</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Email / Membership ID */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>EMAIL OR MEMBERSHIP ID</Text>
            <View style={styles.fieldRow}>
              <Ionicons name="person-outline" size={18} color={COLORS.textMuted} style={styles.fieldIcon} />
              <TextInput
                style={styles.fieldInput}
                placeholder="GSDCP-XXXX-2024"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={identifier}
                onChangeText={setIdentifier}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                data-testid="input-identifier"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>PASSWORD</Text>
            <View style={styles.fieldRow}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.fieldIcon} />
              <TextInput
                ref={passwordRef}
                style={styles.fieldInput}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                data-testid="input-password"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                data-testid="btn-toggle-password"
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot */}
          <TouchableOpacity style={styles.forgotRow} data-testid="btn-forgot-password">
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Sign In button */}
          <TouchableOpacity
            style={[styles.signInBtn, loading && { opacity: 0.65 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
            data-testid="btn-sign-in"
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.signInBtnText}>SIGN IN</Text>
                <Ionicons name="log-in-outline" size={20} color="#fff" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>

          {/* WUSV divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>WUSV AFFILIATE</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Support */}
          <View style={styles.supportRow}>
            <Text style={styles.supportQuestion}>Need assistance with your account?</Text>
            <TouchableOpacity style={styles.supportBtn} data-testid="btn-contact-support">
              <Ionicons name="paw" size={13} color={COLORS.accent} />
              <Text style={styles.supportBtnText}>CONTACT SUPPORT</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            © 2024 GERMAN SHEPHERD DOG CLUB OF PAKISTAN.{"\n"}ALL RIGHTS RESERVED.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: "#f6f8f7" },

  /* ── Hero — exact match to DogProfileScreen / MemberProfileScreen ── */
  heroBanner: { width: "100%", height: 256 },
  heroGradient: {
    position: "absolute",
    left: 0, right: 0, bottom: 0,
    height: 256,
  },
  backButton: {
    position: "absolute",
    left: 16,
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  /* ── Brand section — sits at marginTop:-80 like profileSection ── */
  brandSection: {
    alignItems: "center",
    marginTop: -80,
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  logoOuter: {
    width: 136,
    height: 136,
    borderRadius: 68,
    borderWidth: 4,
    borderColor: COLORS.accent,
    backgroundColor: COLORS.primary,
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
  logoImage: { width: 100, height: 100 },
  clubTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 2,
    marginTop: 8,
    marginBottom: 4,
  },
  clubSubtitle: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    textAlign: "center",
    marginBottom: 8,
  },
  clubTagline: {
    fontSize: 13,
    fontStyle: "italic",
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 24,
  },

  /* ── Form area ── */
  formArea: {
    paddingHorizontal: 16,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 6,
  },
  formSub: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
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
    marginBottom: 8,
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
  eyeBtn: { padding: 8 },

  forgotRow: {
    alignSelf: "flex-end",
    marginTop: -6,
    marginBottom: 24,
  },
  forgotText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "700",
    color: COLORS.accent,
  },

  signInBtn: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: BORDER_RADIUS.md,
    height: 56,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signInBtnText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1.5,
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 1.5,
  },

  supportRow: {
    alignItems: "center",
    gap: 8,
    marginBottom: 28,
  },
  supportQuestion: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  supportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  supportBtnText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "800",
    color: COLORS.accent,
    letterSpacing: 0.8,
  },

  footer: {
    fontSize: 9,
    color: COLORS.textMuted,
    textAlign: "center",
    letterSpacing: 0.5,
    lineHeight: 16,
  },
});
