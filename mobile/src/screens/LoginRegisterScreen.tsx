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
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from "../lib/theme";
import { useAuth } from "../contexts/AuthContext";

const logo = require("../../assets/logo-square.png");
const heroBg = require("../../assets/hero-bg.jpg");

type TabKey = "login" | "register";

export default function LoginRegisterScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("login");

  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginShowPassword, setLoginShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");

  const loginPasswordRef = useRef<TextInput>(null);
  const regEmailRef = useRef<TextInput>(null);
  const regPhoneRef = useRef<TextInput>(null);
  const regPasswordRef = useRef<TextInput>(null);
  const regConfirmPasswordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    setLoginError("");
    if (!loginIdentifier.trim()) { setLoginError("Please enter your email or membership ID"); return; }
    if (!loginPassword) { setLoginError("Please enter your password"); return; }
    setLoginLoading(true);
    try {
      await login(loginIdentifier.trim(), loginPassword);
      navigation.goBack();
    } catch (e: any) {
      setLoginError(e.message ?? "Login failed. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = () => {
    setRegError("");
    if (!regName.trim()) { setRegError("Please enter your full name"); return; }
    if (!regEmail.trim()) { setRegError("Please enter your email"); return; }
    if (!regPassword) { setRegError("Please enter a password"); return; }
    if (regPassword.length < 6) { setRegError("Password must be at least 6 characters"); return; }
    if (regPassword !== regConfirmPassword) { setRegError("Passwords do not match"); return; }
    setRegLoading(true);
    setTimeout(() => {
      setRegLoading(false);
      setRegError("Registration is not available yet. Coming soon!");
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* ── Logo Section ── */}
        <View style={[styles.logoSection, { paddingTop: insets.top + 24 }]}>
          <View style={styles.logoCircle}>
            <Image source={logo} style={styles.logoImg} resizeMode="contain" />
          </View>
          <Text style={styles.appTitle}>GSDCP</Text>
          <Text style={styles.appSubtitle}>GERMAN SHEPHERD DOG CLUB OF PAKISTAN</Text>
        </View>

        {/* ── Hero Image ── */}
        <ImageBackground source={heroBg} style={styles.heroImage} resizeMode="cover">
          <View style={styles.heroDimmer} />
          <Text style={styles.heroText}>Preserving the standard of the breed since 1978</Text>
        </ImageBackground>

        {/* ── Tabs ── */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "login" && styles.tabActive]}
            onPress={() => setActiveTab("login")}
            activeOpacity={0.7}
            data-testid="tab-login"
          >
            <Text style={[styles.tabText, activeTab === "login" && styles.tabTextActive]}>LOGIN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "register" && styles.tabActive]}
            onPress={() => setActiveTab("register")}
            activeOpacity={0.7}
            data-testid="tab-register"
          >
            <Text style={[styles.tabText, activeTab === "register" && styles.tabTextActive]}>REGISTER</Text>
          </TouchableOpacity>
        </View>

        {/* ── Form area ── */}
        <View style={styles.formArea}>
          {activeTab === "login" ? (
            <>
              <Text style={styles.formTitle}>Welcome Back</Text>
              <Text style={styles.formSubtitle}>Sign in to manage your kennel and pedigrees.</Text>

              {loginError ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                  <Text style={styles.errorText}>{loginError}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL OR MEMBERSHIP ID</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="GSDCP-XXXX-2024"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={loginIdentifier}
                    onChangeText={setLoginIdentifier}
                    returnKeyType="next"
                    onSubmitEditing={() => loginPasswordRef.current?.focus()}
                    data-testid="input-login-identifier"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PASSWORD</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    ref={loginPasswordRef}
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!loginShowPassword}
                    value={loginPassword}
                    onChangeText={setLoginPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    data-testid="input-login-password"
                  />
                  <TouchableOpacity
                    onPress={() => setLoginShowPassword(!loginShowPassword)}
                    style={styles.eyeButton}
                    data-testid="btn-toggle-login-password"
                  >
                    <Ionicons
                      name={loginShowPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color={COLORS.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.forgotPassword} data-testid="btn-forgot-password">
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.signInButton, loginLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loginLoading}
                activeOpacity={0.85}
                data-testid="btn-login"
              >
                {loginLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.signInButtonText}>SIGN IN</Text>
                    <Ionicons name="log-in-outline" size={20} color="#fff" style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.switchRow}>
                <Text style={styles.switchText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => setActiveTab("register")} data-testid="btn-switch-to-register">
                  <Text style={styles.switchLink}>Register</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.formTitle}>Create Account</Text>
              <Text style={styles.formSubtitle}>Join the German Shepherd Dog Club of Pakistan.</Text>

              {regError ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                  <Text style={styles.errorText}>{regError}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>FULL NAME</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="words"
                    value={regName}
                    onChangeText={setRegName}
                    returnKeyType="next"
                    onSubmitEditing={() => regEmailRef.current?.focus()}
                    data-testid="input-reg-name"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    ref={regEmailRef}
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={regEmail}
                    onChangeText={setRegEmail}
                    returnKeyType="next"
                    onSubmitEditing={() => regPhoneRef.current?.focus()}
                    data-testid="input-reg-email"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PHONE NUMBER</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    ref={regPhoneRef}
                    style={styles.input}
                    placeholder="Enter your phone number"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="phone-pad"
                    value={regPhone}
                    onChangeText={setRegPhone}
                    returnKeyType="next"
                    onSubmitEditing={() => regPasswordRef.current?.focus()}
                    data-testid="input-reg-phone"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PASSWORD</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    ref={regPasswordRef}
                    style={styles.input}
                    placeholder="Create a password"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!regShowPassword}
                    value={regPassword}
                    onChangeText={setRegPassword}
                    returnKeyType="next"
                    onSubmitEditing={() => regConfirmPasswordRef.current?.focus()}
                    data-testid="input-reg-password"
                  />
                  <TouchableOpacity
                    onPress={() => setRegShowPassword(!regShowPassword)}
                    style={styles.eyeButton}
                    data-testid="btn-toggle-reg-password"
                  >
                    <Ionicons
                      name={regShowPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color={COLORS.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    ref={regConfirmPasswordRef}
                    style={styles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={!regShowPassword}
                    value={regConfirmPassword}
                    onChangeText={setRegConfirmPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleRegister}
                    data-testid="input-reg-confirm-password"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.signInButton, regLoading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={regLoading}
                activeOpacity={0.85}
                data-testid="btn-register"
              >
                {regLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.signInButtonText}>CREATE ACCOUNT</Text>
                    <Ionicons name="person-add-outline" size={20} color="#fff" style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.switchRow}>
                <Text style={styles.switchText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => setActiveTab("login")} data-testid="btn-switch-to-login">
                  <Text style={styles.switchLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ── WUSV Affiliate divider ── */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>WUSV AFFILIATE</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ── Contact Support ── */}
          <View style={styles.supportSection}>
            <Text style={styles.supportQuestion}>Need assistance with your registration?</Text>
            <TouchableOpacity style={styles.supportBtn} data-testid="btn-contact-support">
              <Ionicons name="paw" size={14} color={COLORS.accent} />
              <Text style={styles.supportBtnText}>CONTACT SUPPORT</Text>
            </TouchableOpacity>
          </View>

          {/* ── Footer ── */}
          <Text style={styles.footer}>
            © 2024 GERMAN SHEPHERD DOG CLUB OF PAKISTAN. ALL RIGHTS RESERVED.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: COLORS.background },

  logoSection: {
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  logoImg: { width: 56, height: 56 },
  appTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 2,
  },
  appSubtitle: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginTop: 4,
    textAlign: "center",
  },

  heroImage: {
    marginHorizontal: SPACING.lg,
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "flex-end",
    marginBottom: SPACING.xl,
  },
  heroDimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  heroText: {
    color: "#fff",
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
    padding: SPACING.lg,
    lineHeight: 22,
  },

  tabRow: {
    flexDirection: "row",
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  tabTextActive: {
    color: COLORS.primary,
  },

  formArea: {
    paddingHorizontal: SPACING.lg,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
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

  inputGroup: { marginBottom: SPACING.lg },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
  },
  inputIcon: { marginRight: SPACING.sm },
  input: {
    flex: 1,
    height: 50,
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
  },
  eyeButton: { padding: SPACING.sm },

  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: SPACING.xl,
    marginTop: -SPACING.sm,
  },
  forgotPasswordText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.accent,
    fontWeight: "700",
  },

  signInButton: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: BORDER_RADIUS.md,
    height: 54,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  buttonDisabled: { opacity: 0.65 },
  signInButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1,
  },

  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  switchText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  switchLink: { fontSize: FONT_SIZES.md, color: COLORS.primary, fontWeight: "700" },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 1.5,
  },

  supportSection: {
    alignItems: "center",
    gap: 8,
    marginBottom: SPACING.xl,
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
    marginTop: SPACING.md,
  },
});
