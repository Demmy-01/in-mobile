import { Colors } from "@/constants/Colors";
import { Radii, Typography } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { useToastStore } from "@/store/toastStore";
import { useAuthStore } from "@/store/authStore";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState, useRef, useEffect } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Eye, EyeOff } from "lucide-react-native";

type Stage = "email" | "otp" | "reset";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const showToast = useToastStore((state) => state.showToast);
  const { setSession, fetchProfile } = useAuthStore();

  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(59);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (stage !== "otp") return;
    if (countdown === 0) { setCanResend(true); return; }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, stage]);

  // ── Stage 1: send OTP to email ────────────────────────────────────
  const handleSendOtp = async () => {
    if (!email.trim()) {
      showToast("Please enter your email address.", "error", "Validation Error");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false },
    });
    setIsLoading(false);

    if (error) {
      showToast(error.message, "error", "Failed to Send OTP");
    } else {
      // Always advance to OTP stage — Supabase silently ignores unknown emails
      // (shouldCreateUser: false) so we don't leak whether an account exists.
      setCountdown(59);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      setStage("otp");
    }
  };

  // ── Stage 2: verify OTP ───────────────────────────────────────────
  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 8) {
      showToast("Please enter the complete 8-digit code.", "error", "Validation Error");
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code,
      type: "email",
    });
    setIsLoading(false);

    if (error) {
      showToast(error.message, "error", "Verification Failed");
    } else {
      // Session is now active — store it so we can call updateUser
      if (data.session) {
        setSession(data.session);
        await fetchProfile();
      }
      setStage("reset");
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    // Handle paste: if multiple characters are entered at once, distribute them
    if (text.length > 1) {
      const digits = text.replace(/\D/g, "").slice(0, 8).split("");
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < 8) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      // Focus the box after the last pasted digit
      const nextIndex = Math.min(index + digits.length, 7);
      inputRefs.current[nextIndex]?.focus();
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = text.slice(-1);
    setOtp(newOtp);
    if (text && index < 7) inputRefs.current[index + 1]?.focus();
    if (!text && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleResend = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false },
    });
    setIsLoading(false);
    if (!error) {
      setCountdown(59);
      setCanResend(false);
      setOtp(["", "", "", "", "", "", "", ""]);
      showToast("A new OTP has been sent to your email.", "success", "OTP Resent");
    } else {
      showToast(error.message, "error", "Resend Failed");
    }
  };

  // ── Stage 3: reset password ───────────────────────────────────────
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      showToast("Password must be at least 8 characters.", "error", "Validation Error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match.", "error", "Validation Error");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsLoading(false);

    if (error) {
      showToast(error.message, "error", "Reset Failed");
    } else {
      showToast(
        "Password updated successfully! Please sign in.",
        "success",
        "Password Reset ✅"
      );
      // Sign out so the auth guard doesn't auto-redirect and user must log in fresh
      await supabase.auth.signOut();
      router.replace("/(auth)/sign-in");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.light.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <TouchableOpacity
          onPress={() => {
            if (stage === "otp") setStage("email");
            else if (stage === "reset") setStage("otp");
            else router.back();
          }}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* ── STEP 1: Email ── */}
        {stage === "email" && (
          <>
            <View style={styles.iconBg}>
              <Text style={{ fontSize: 36 }}>🔐</Text>
            </View>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your registered email address and we'll send you a
              one-time code to reset your password.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.light.placeholder}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSendOtp}
              disabled={isLoading}
              style={[styles.btn, { marginTop: 32 }]}
            >
              <LinearGradient
                colors={[Colors.light.accentBlue, Colors.light.primaryBlue]}
                style={styles.btnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Send Verification Code</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {/* ── STEP 2: OTP ── */}
        {stage === "otp" && (
          <>
            <View style={styles.iconBg}>
              <Text style={{ fontSize: 36 }}>📩</Text>
            </View>
            <Text style={styles.title}>Enter Code</Text>
            <Text style={styles.subtitle}>
              We sent an 8-digit verification code to{"\n"}
              <Text style={{ color: Colors.light.primaryBlue, fontFamily: "DMSans_600SemiBold" }}>
                {email}
              </Text>
            </Text>

            <View style={styles.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(r) => { inputRefs.current[i] = r; }}
                  style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                  value={digit}
                  onChangeText={(t) => handleOtpChange(t, i)}
                  keyboardType="number-pad"
                  maxLength={8}
                  selectTextOnFocus
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={handleVerifyOtp}
              disabled={isLoading}
              style={styles.btn}
            >
              <LinearGradient
                colors={[Colors.light.accentBlue, Colors.light.primaryBlue]}
                style={styles.btnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Verify Code</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleResend}
              disabled={!canResend || isLoading}
              style={styles.resendBtn}
            >
              <Text style={[styles.resendText, !canResend && styles.resendTextDisabled]}>
                {canResend ? "Resend Code" : `Resend in ${countdown}s`}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── STEP 3: Reset Password ── */}
        {stage === "reset" && (
          <>
            <View style={styles.iconBg}>
              <Text style={{ fontSize: 36 }}>🔑</Text>
            </View>
            <Text style={styles.title}>New Password</Text>
            <Text style={styles.subtitle}>
              Create a strong new password for your account.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="At least 8 characters"
                  placeholderTextColor={Colors.light.placeholder}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                  {showPassword
                    ? <EyeOff size={20} color={Colors.light.textMuted} />
                    : <Eye size={20} color={Colors.light.textMuted} />}
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.fieldGroup, { marginTop: 16 }]}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter password"
                  placeholderTextColor={Colors.light.placeholder}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword((v) => !v)}>
                  {showConfirmPassword
                    ? <EyeOff size={20} color={Colors.light.textMuted} />
                    : <Eye size={20} color={Colors.light.textMuted} />}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleResetPassword}
              disabled={isLoading}
              style={[styles.btn, { marginTop: 32 }]}
            >
              <LinearGradient
                colors={[Colors.light.accentBlue, Colors.light.primaryBlue]}
                style={styles.btnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Reset Password</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 28, paddingTop: 60 },
  backBtn: { marginBottom: 40 },
  backText: { ...Typography.bodySemiBold, color: Colors.light.primaryBlue },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.light.lightBlue,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  title: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 28,
    color: Colors.light.textDark,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.light.textMuted,
    marginTop: 10,
    lineHeight: 24,
    marginBottom: 32,
  },
  fieldGroup: { gap: 6 },
  label: { ...Typography.labelSemiBold, color: Colors.light.textDark },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.inputBg,
    borderWidth: 1.5,
    borderColor: Colors.light.inputBorder,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.light.textDark,
    paddingVertical: 14,
  },
  btn: { borderRadius: Radii.button, overflow: "hidden" },
  btnGradient: { paddingVertical: 16, alignItems: "center" },
  btnText: { ...Typography.button, color: "#FFFFFF", fontSize: 16 },
  // OTP
  otpRow: {
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    marginBottom: 36,
  },
  otpBox: {
    width: 38,
    height: 48,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.light.inputBorder,
    backgroundColor: Colors.light.inputBg,
    textAlign: "center",
    fontSize: 22,
    fontFamily: "DMSans_700Bold",
    color: Colors.light.textDark,
  },
  otpBoxFilled: {
    borderColor: Colors.light.primaryBlue,
    backgroundColor: Colors.light.lightBlue,
  },
  resendBtn: { marginTop: 20, alignItems: "center" },
  resendText: {
    ...Typography.bodySemiBold,
    color: Colors.light.primaryBlue,
  },
  resendTextDisabled: {
    color: Colors.light.textMuted,
  },
});
