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

type SignInMode = "membership" | "username" | "otp";

const MODES: { id: SignInMode; label: string; icon: string }[] = [
  { id: "membership", label: "Membership No.", icon: "card-outline" },
  { id: "username",   label: "Username",        icon: "person-outline" },
  { id: "otp",        label: "Phone OTP",        icon: "phone-portrait-outline" },
];

/**
 * Smart membership-number formatter that respects backspace.
 * - Typing "p" → "P-"  (letter auto-uppercased, hyphen auto-inserted)
 * - Typing "1" from "P-" → "P-1"
 * - Backspacing from "P-" → ""  (clears entirely so hyphen doesn't trap the user)
 * - Backspacing from "P-123" → "P-12"  (normal digit deletion)
 * - Non-letter first char → rejected silently
 * - Non-digit after the hyphen → rejected silently
 */
function smartFormatMembershipNo(raw: string, prev: string): string {
  // Detect a backspace that would leave just the letter with no hyphen/digits.
  // In that state clear fully — otherwise the auto-hyphen would trap the user.
  if (raw.length < prev.length && /^[A-Z]-$/.test(prev) && /^[A-Z]$/.test(raw)) {
    return "";
  }

  // Strip everything except uppercase letters and digits
  const stripped = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!stripped) return "";

  const letter = stripped[0];
  if (!/[A-Z]/.test(letter)) return ""; // first char must be a letter

  const digits = stripped.slice(1).replace(/\D/g, "");
  // Auto-insert hyphen as soon as the letter is present
  return digits ? `${letter}-${digits}` : `${letter}-`;
}

/** Validates membership number: single uppercase letter, hyphen, 1+ digits */
function isValidMembershipNo(value: string): boolean {
  return /^[A-Z]-\d+$/.test(value);
}

/** Live status for the membership field */
function memberNoStatus(value: string): { icon: string; text: string; color: string } | null {
  if (!value) return null;
  if (isValidMembershipNo(value))
    return { icon: "checkmark-circle", text: "Valid membership number", color: "#16A34A" };
  if (/^[A-Z]-$/.test(value))
    return { icon: "information-circle-outline", text: "Now enter your membership digits", color: COLORS.textMuted };
  if (/^[A-Z]-\d+$/.test(value) === false && value.length > 2)
    return { icon: "alert-circle-outline", text: "Digits only after the hyphen (e.g. P-1234)", color: "#D97706" };
  return null;
}

export default function LoginRegisterScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { login } = useAuth();

  const [mode, setMode] = useState<SignInMode>("membership");

  // Mode 1 — membership
  const [memberNo, setMemberNo] = useState("");
  const [memberPassword, setMemberPassword] = useState("");
  const [showMemberPassword, setShowMemberPassword] = useState(false);

  // Mode 2 — username
  const [username, setUsername] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [showUserPassword, setShowUserPassword] = useState(false);

  // Mode 3 — phone OTP
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const memberPasswordRef  = useRef<TextInput>(null);
  const userPasswordRef    = useRef<TextInput>(null);
  const otpRef             = useRef<TextInput>(null);
  const prevMemberNoRef    = useRef(""); // tracks last formatted value for backspace detection

  const handleMemberNoChange = (raw: string) => {
    const formatted = smartFormatMembershipNo(raw, prevMemberNoRef.current);
    prevMemberNoRef.current = formatted;
    setMemberNo(formatted);
  };

  const handleSendOtp = () => {
    if (!phone.trim()) { setError("Please enter your phone number"); return; }
    setError("");
    setSendingOtp(true);
    setTimeout(() => {
      setSendingOtp(false);
      setOtpSent(true);
      otpRef.current?.focus();
    }, 1500);
  };

  const handleLogin = async () => {
    setError("");

    if (mode === "membership") {
      if (!memberNo) { setError("Please enter your membership number"); return; }
      if (!isValidMembershipNo(memberNo)) {
        setError("Format: one uppercase letter, hyphen, then numbers (e.g. P-1234)");
        return;
      }
      if (!memberPassword) { setError("Please enter your password"); return; }
    } else if (mode === "username") {
      if (!username.trim()) { setError("Please enter your username"); return; }
      if (!userPassword) { setError("Please enter your password"); return; }
    } else {
      if (!phone.trim()) { setError("Please enter your phone number"); return; }
      if (!otpSent) { setError("Please request an OTP first"); return; }
      if (!otpCode.trim()) { setError("Please enter the OTP"); return; }
    }

    setLoading(true);
    try {
      const identifier =
        mode === "membership" ? memberNo :
        mode === "username"   ? username.trim() :
        phone.trim();
      const credential = mode === "otp" ? otpCode.trim() : (mode === "membership" ? memberPassword : userPassword);
      await login(identifier, credential, mode);
      // If we arrived here directly (Profile tab, not logged in), the navigator
      // will re-mount automatically with ProfileHome. If we navigated here from
      // inside the app, go back to wherever the user came from.
      if (navigation.canGoBack()) navigation.goBack();
    } catch (e: any) {
      setError(e.message ?? "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m: SignInMode) => {
    setMode(m);
    setError("");
    setOtpSent(false);
    setOtpCode("");
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
          {navigation.canGoBack() && (
            <TouchableOpacity
              style={[styles.backButton, { top: insets.top + 12 }]}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              data-testid="btn-back"
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
          )}
        </ImageBackground>

        {/* ── Brand ── */}
        <View style={styles.brandSection}>
          <View style={styles.logoOuter}>
            <Image source={logo} style={styles.logoImage} resizeMode="contain" />
          </View>
          <Text style={styles.clubTitle}>Member Sign In</Text>
          <Text style={styles.clubSubtitle}>
            Access your kennel, pedigrees & show records.
          </Text>
        </View>

        {/* ── Form ── */}
        <View style={styles.formArea}>

          {/* ── Mode selector ── */}
          <View style={styles.modeBar}>
            {MODES.map((m) => {
              const active = m.id === mode;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.modeTab, active && styles.modeTabActive]}
                  onPress={() => switchMode(m.id)}
                  activeOpacity={0.75}
                  data-testid={`tab-mode-${m.id}`}
                >
                  <Ionicons
                    name={m.icon as any}
                    size={14}
                    color={active ? "#fff" : COLORS.textMuted}
                    style={{ marginBottom: 3 }}
                  />
                  <Text style={[styles.modeTabText, active && styles.modeTabTextActive]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Error box ── */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* ── MODE 1: Membership Number + Password ── */}
          {mode === "membership" && (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>MEMBERSHIP NUMBER</Text>
                {(() => {
                  const status = memberNoStatus(memberNo);
                  const valid  = isValidMembershipNo(memberNo);
                  return (
                    <>
                      <View style={[
                        styles.fieldRow,
                        valid
                          ? styles.fieldRowValid
                          : memberNo.length > 2 && !valid
                            ? styles.fieldRowWarn
                            : null,
                      ]}>
                        <Ionicons
                          name="card-outline"
                          size={18}
                          color={valid ? "#16A34A" : COLORS.textMuted}
                          style={styles.fieldIcon}
                        />
                        <TextInput
                          style={styles.fieldInput}
                          placeholder="P-1234"
                          placeholderTextColor={COLORS.textMuted}
                          autoCapitalize="characters"
                          autoCorrect={false}
                          value={memberNo}
                          onChangeText={handleMemberNoChange}
                          returnKeyType="next"
                          maxLength={12}
                          onSubmitEditing={() => memberPasswordRef.current?.focus()}
                          data-testid="input-membership-no"
                        />
                        {valid && (
                          <Ionicons name="checkmark-circle" size={20} color="#16A34A" style={{ marginLeft: 4 }} />
                        )}
                      </View>
                      {status && (
                        <View style={styles.liveHint}>
                          <Ionicons name={status.icon as any} size={13} color={status.color} />
                          <Text style={[styles.liveHintText, { color: status.color }]}>{status.text}</Text>
                        </View>
                      )}
                    </>
                  );
                })()}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>PASSWORD</Text>
                <View style={styles.fieldRow}>
                  <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.fieldIcon} />
                  <TextInput
                    ref={memberPasswordRef}
                    style={styles.fieldInput}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!showMemberPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    value={memberPassword}
                    onChangeText={setMemberPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    data-testid="input-member-password"
                  />
                  <TouchableOpacity onPress={() => setShowMemberPassword(!showMemberPassword)} style={styles.eyeBtn} data-testid="btn-toggle-member-pw">
                    <Ionicons name={showMemberPassword ? "eye-off-outline" : "eye-outline"} size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.forgotRow} data-testid="btn-forgot-password">
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── MODE 2: Username + Password ── */}
          {mode === "username" && (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>USERNAME</Text>
                <View style={styles.fieldRow}>
                  <Ionicons name="person-outline" size={18} color={COLORS.textMuted} style={styles.fieldIcon} />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Enter your username"
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={username}
                    onChangeText={setUsername}
                    returnKeyType="next"
                    onSubmitEditing={() => userPasswordRef.current?.focus()}
                    data-testid="input-username"
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>PASSWORD</Text>
                <View style={styles.fieldRow}>
                  <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.fieldIcon} />
                  <TextInput
                    ref={userPasswordRef}
                    style={styles.fieldInput}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!showUserPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    value={userPassword}
                    onChangeText={setUserPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    data-testid="input-user-password"
                  />
                  <TouchableOpacity onPress={() => setShowUserPassword(!showUserPassword)} style={styles.eyeBtn} data-testid="btn-toggle-user-pw">
                    <Ionicons name={showUserPassword ? "eye-off-outline" : "eye-outline"} size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.forgotRow} data-testid="btn-forgot-password-user">
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── MODE 3: Phone OTP ── */}
          {mode === "otp" && (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>REGISTERED PHONE NUMBER</Text>
                <View style={styles.fieldRow}>
                  <Ionicons name="call-outline" size={18} color={COLORS.textMuted} style={styles.fieldIcon} />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="+92 300 0000000"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={(v) => { setPhone(v); setOtpSent(false); setOtpCode(""); }}
                    returnKeyType={otpSent ? "next" : "done"}
                    onSubmitEditing={otpSent ? () => otpRef.current?.focus() : handleSendOtp}
                    data-testid="input-phone"
                  />
                  <TouchableOpacity
                    style={[styles.otpSendBtn, (!phone.trim() || sendingOtp) && { opacity: 0.5 }]}
                    onPress={handleSendOtp}
                    disabled={!phone.trim() || sendingOtp}
                    activeOpacity={0.8}
                    data-testid="btn-send-otp"
                  >
                    {sendingOtp
                      ? <ActivityIndicator size="small" color={COLORS.primary} />
                      : <Text style={styles.otpSendBtnText}>{otpSent ? "Resend" : "Send OTP"}</Text>
                    }
                  </TouchableOpacity>
                </View>
              </View>

              {otpSent && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>ONE-TIME PASSWORD (OTP)</Text>
                  <View style={styles.fieldHint}>
                    <Ionicons name="checkmark-circle" size={13} color="#16A34A" />
                    <Text style={[styles.hintText, { color: "#16A34A" }]}>OTP sent to {phone}</Text>
                  </View>
                  <View style={styles.fieldRow}>
                    <Ionicons name="keypad-outline" size={18} color={COLORS.textMuted} style={styles.fieldIcon} />
                    <TextInput
                      ref={otpRef}
                      style={[styles.fieldInput, styles.otpInput]}
                      placeholder="• • • • • •"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="number-pad"
                      maxLength={6}
                      value={otpCode}
                      onChangeText={setOtpCode}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                      data-testid="input-otp"
                    />
                  </View>
                </View>
              )}
            </>
          )}

          {/* ── Sign In button ── */}
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
                <Text style={styles.signInBtnText}>
                  {mode === "otp" && !otpSent ? "CONTINUE" : "SIGN IN"}
                </Text>
                <Ionicons
                  name={mode === "otp" && !otpSent ? "arrow-forward" : "log-in-outline"}
                  size={20}
                  color="#fff"
                  style={{ marginLeft: 8 }}
                />
              </>
            )}
          </TouchableOpacity>

          {/* ── WUSV divider ── */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>WUSV AFFILIATE</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ── Support ── */}
          <View style={styles.supportRow}>
            <Text style={styles.supportQuestion}>Need assistance with your account?</Text>
            <TouchableOpacity style={styles.supportBtn} data-testid="btn-contact-support">
              <Ionicons name="paw" size={13} color={COLORS.accent} />
              <Text style={styles.supportBtnText}>CONTACT SUPPORT</Text>
            </TouchableOpacity>
          </View>

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

  heroBanner: { width: "100%", height: 256 },
  heroGradient: { position: "absolute", left: 0, right: 0, bottom: 0, height: 256 },
  backButton: {
    position: "absolute", left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center", alignItems: "center", zIndex: 10,
  },

  brandSection: {
    alignItems: "center",
    marginTop: -80,
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  logoOuter: {
    width: 136, height: 136, borderRadius: 68,
    borderWidth: 4, borderColor: COLORS.accent,
    backgroundColor: COLORS.primary,
    overflow: "hidden",
    marginBottom: SPACING.md,
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 8,
  },
  logoImage: { width: 100, height: 100 },
  clubTitle: {
    fontSize: 22, fontWeight: "800", color: COLORS.primary,
    letterSpacing: 0.5, marginTop: 8, marginBottom: 4,
  },
  clubSubtitle: {
    fontSize: FONT_SIZES.sm, color: COLORS.textSecondary,
    textAlign: "center", lineHeight: 20,
  },

  formArea: { paddingHorizontal: 16 },

  /* ── Mode selector ── */
  modeBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: BORDER_RADIUS.md,
  },
  modeTabActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  modeTabText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  modeTabTextActive: { color: "#fff" },

  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1, borderColor: "#FECACA",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.lg,
  },
  errorText: {
    flex: 1, fontSize: FONT_SIZES.sm, color: COLORS.error, fontWeight: "500",
  },

  fieldGroup: { marginBottom: 18 },
  fieldLabel: {
    fontSize: 11, fontWeight: "700",
    color: COLORS.textSecondary, letterSpacing: 0.8, marginBottom: 4,
  },
  fieldHint: {
    flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8,
  },
  hintText: {
    fontSize: 11, color: COLORS.textMuted, fontStyle: "italic",
  },
  liveHint: {
    flexDirection: "row", alignItems: "center", gap: 5,
    marginTop: 6,
  },
  liveHintText: {
    fontSize: 11, fontWeight: "600",
  },
  fieldRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  fieldRowValid: {
    borderColor: "#16A34A",
    backgroundColor: "#F0FDF4",
  },
  fieldRowWarn: {
    borderColor: "#D97706",
    backgroundColor: "#FFFBEB",
  },
  fieldIcon: { marginRight: 10 },
  fieldInput: {
    flex: 1, height: 52, fontSize: FONT_SIZES.lg, color: COLORS.text,
  },
  otpInput: {
    letterSpacing: 6, fontWeight: "700", textAlign: "center",
  },
  eyeBtn: { padding: 8 },

  otpSendBtn: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: "rgba(15,92,58,0.1)",
    marginLeft: 6,
    minWidth: 72,
    alignItems: "center",
  },
  otpSendBtnText: {
    fontSize: 12, fontWeight: "700", color: COLORS.primary,
  },

  forgotRow: {
    alignSelf: "flex-end", marginTop: -6, marginBottom: 24,
  },
  forgotText: {
    fontSize: FONT_SIZES.sm, fontWeight: "700", color: COLORS.accent,
  },

  signInBtn: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: BORDER_RADIUS.md,
    height: 56, flexDirection: "row",
    justifyContent: "center", alignItems: "center",
    marginBottom: 28,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  signInBtnText: {
    fontSize: FONT_SIZES.lg, fontWeight: "800", color: "#fff", letterSpacing: 1.5,
  },

  dividerRow: {
    flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerLabel: {
    fontSize: 10, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 1.5,
  },

  supportRow: { alignItems: "center", gap: 8, marginBottom: 28 },
  supportQuestion: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  supportBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  supportBtnText: {
    fontSize: FONT_SIZES.sm, fontWeight: "800", color: COLORS.accent, letterSpacing: 0.8,
  },

  footer: {
    fontSize: 9, color: COLORS.textMuted,
    textAlign: "center", letterSpacing: 0.5, lineHeight: 16,
  },
});
