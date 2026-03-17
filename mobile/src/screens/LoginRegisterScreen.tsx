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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from "../lib/theme";

const logo = require("../../assets/logo-square.png");

type TabKey = "login" | "register";

export default function LoginRegisterScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<TabKey>("login");

  const [loginEmail, setLoginEmail] = useState("");
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

  const handleLogin = () => {
    setLoginError("");
    if (!loginEmail.trim()) { setLoginError("Please enter your email"); return; }
    if (!loginPassword) { setLoginError("Please enter your password"); return; }
    setLoginLoading(true);
    setTimeout(() => {
      setLoginLoading(false);
      setLoginError("Login is not available yet. Coming soon!");
    }, 1500);
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
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + SPACING.md }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={true}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          data-testid="btn-back"
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.logoSection}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.appTitle}>GSDCP</Text>
          <Text style={styles.appSubtitle}>German Shepherd Dog Club of Pakistan</Text>
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "login" && styles.tabActive]}
            onPress={() => setActiveTab("login")}
            activeOpacity={0.7}
            data-testid="tab-login"
          >
            <Text style={[styles.tabText, activeTab === "login" && styles.tabTextActive]}>
              Sign In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "register" && styles.tabActive]}
            onPress={() => setActiveTab("register")}
            activeOpacity={0.7}
            data-testid="tab-register"
          >
            <Text style={[styles.tabText, activeTab === "register" && styles.tabTextActive]}>
              Register
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "login" ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            <Text style={styles.formSubtitle}>Sign in to your GSDCP account</Text>

            {loginError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                <Text style={styles.errorText}>{loginError}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={loginEmail}
                  onChangeText={setLoginEmail}
                  returnKeyType="next"
                  onSubmitEditing={() => loginPasswordRef.current?.focus()}
                  data-testid="input-login-email"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  ref={loginPasswordRef}
                  style={styles.input}
                  placeholder="Enter your password"
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
              style={[styles.primaryButton, loginLoading && styles.primaryButtonDisabled]}
              onPress={handleLogin}
              disabled={loginLoading}
              activeOpacity={0.8}
              data-testid="btn-login"
            >
              {loginLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.switchRow}>
              <Text style={styles.switchText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => setActiveTab("register")} data-testid="btn-switch-to-register">
                <Text style={styles.switchLink}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Create Account</Text>
            <Text style={styles.formSubtitle}>Join the German Shepherd Dog Club of Pakistan</Text>

            {regError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                <Text style={styles.errorText}>{regError}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
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
              <Text style={styles.inputLabel}>Email</Text>
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
              <Text style={styles.inputLabel}>Phone Number</Text>
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
              <Text style={styles.inputLabel}>Password</Text>
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
              <Text style={styles.inputLabel}>Confirm Password</Text>
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
              style={[styles.primaryButton, regLoading && styles.primaryButtonDisabled]}
              onPress={handleRegister}
              disabled={regLoading}
              activeOpacity={0.8}
              data-testid="btn-register"
            >
              {regLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.switchRow}>
              <Text style={styles.switchText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => setActiveTab("login")} data-testid="btn-switch-to-login">
                <Text style={styles.switchLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    flexGrow: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: SPACING.sm,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 1,
  },
  appSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: 4,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: BORDER_RADIUS.md,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: "#fff",
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
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
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
  },
  eyeButton: {
    padding: SPACING.sm,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: SPACING.xl,
    marginTop: -SPACING.sm,
  },
  forgotPasswordText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "700",
    color: "#fff",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: SPACING.xl,
  },
  switchText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  switchLink: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: "700",
  },
});
