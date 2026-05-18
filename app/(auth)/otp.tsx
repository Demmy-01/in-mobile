import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/Colors";
import { Typography, Radii } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";

export default function OtpScreen() {
  const { setSession, fetchProfile, signOut } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);
  const router = useRouter();
  const { email, firstName, lastName, matricNumber } = useLocalSearchParams<{
    email: string;
    firstName: string;
    lastName: string;
    matricNumber: string;
  }>();
  const [otp, setOtp] = useState(["", "", "", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(59);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (countdown === 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text.slice(-1);
    setOtp(newOtp);
    if (text && index < 7) inputRefs.current[index + 1]?.focus();
    if (!text && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 8) {
      showToast("Please enter the complete 8-digit verification code.", "error", "Validation Error");
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email!,
      token: code,
      type: "signup",
    });

    if (error) {
      setIsLoading(false);
      showToast(error.message, "error", "Verification Failed");
      return;
    }

    // OTP verified — now we have a real confirmed session.
    // This is the correct moment to insert the student_profiles row
    // because auth.uid() is now set and RLS will allow the insert.
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setIsLoading(false);
      showToast("Failed to create session. Please try again.", "error", "Session Error");
      return;
    }

    // 1. Save profile via RPC — the function atomically removes any orphaned
    //    row that shares the same matric_number (different user id) before
    //    upserting, preventing the "duplicate key … matric_number" error that
    //    a plain upsert can't avoid when ghost rows exist from prior attempts.
    console.log("[OTP] Saving profile via RPC for userId:", session.user.id);
    const { data: rpcData, error: profileError } = await supabase.rpc(
      "save_student_profile",
      {
        p_id:            session.user.id,
        p_first_name:    firstName?.trim()     ?? "",
        p_last_name:     lastName?.trim()      ?? "",
        p_email:         email?.trim()         ?? session.user.email ?? "",
        p_matric_number: matricNumber?.trim()  ?? null,
      },
    );

    // rpcData is the JSON row returned by the function
    const profileData = rpcData ?? null;

    if (profileError) {
      console.error(
        "[OTP] Profile RPC failed:",
        profileError.code,
        profileError.message,
      );

      if (profileError.code === "42501") {
        showToast("Row-level security policy prevented saving your profile. Please contact support.", "error", "Database Configuration Error");
      } else {
        showToast(`Could not save your profile: ${profileError.message}`, "error", "Profile Creation Failed");
      }
      setIsLoading(false);
      return;
    }

    console.log("[OTP] ✅ Profile created successfully:", profileData?.id);

    // 2. Direct authentication: Set the session in the store and fetch the profile
    try {
      setSession(session);
      await fetchProfile();
      console.log("[OTP] ✅ Session authenticated and profile fetched successfully");
    } catch (authErr) {
      console.error("[OTP] Direct auth initialization failed:", authErr);
    }

    setIsLoading(false);

    // 3. Welcome success toast notification
    showToast("Welcome to InternLink!", "success", "Email Verified! 🎉");

    // 4. Small delay for animations, then transition directly to the dashboard home
    await new Promise((resolve) => setTimeout(resolve, 400));
    router.replace("/(app)/(tabs)/home");
  };

  const handleResend = async () => {
    if (!canResend) return;
    setCanResend(false);
    setCountdown(59);
    await supabase.auth.resend({ type: "signup", email: email! });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.light.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.iconWrap}>
          <LinearGradient
            colors={[Colors.light.lightBlue, "#DDEAFF"]}
            style={styles.iconBg}
          >
            <Text style={styles.icon}>✉️</Text>
          </LinearGradient>
        </View>

        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>
          We sent an 8-digit verification code to{"\n"}
          <Text style={styles.emailHighlight}>{email}</Text>
        </Text>

        {/* OTP Cells */}
        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => {
                inputRefs.current[i] = ref;
              }}
              style={[styles.otpCell, digit && styles.otpCellFilled]}
              value={digit}
              onChangeText={(t) => handleChange(t, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Timer */}
        <View style={styles.timerRow}>
          {!canResend ? (
            <Text style={styles.timerText}>
              Resend in{" "}
              <Text style={styles.timerCount}>
                0:{countdown.toString().padStart(2, "0")}
              </Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>Resend Code</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          onPress={handleVerify}
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
              <Text style={styles.btnText}>Verify Email</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 60,
    alignItems: "center",
  },
  backBtn: { alignSelf: "flex-start", marginBottom: 40 },
  backText: { ...Typography.bodySemiBold, color: Colors.light.primaryBlue },
  iconWrap: { marginBottom: 28 },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: { fontSize: 36 },
  title: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 28,
    color: Colors.light.textDark,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.body,
    color: Colors.light.textMuted,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 24,
  },
  emailHighlight: { ...Typography.bodyMedium, color: Colors.light.textDark },
  otpRow: { flexDirection: "row", gap: 10, marginTop: 36 },
  otpCell: {
    width: 38,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.light.inputBorder,
    backgroundColor: Colors.light.inputBg,
    textAlign: "center",
    fontSize: 20,
    fontFamily: "DMSans_700Bold",
    color: Colors.light.textDark,
  },
  otpCellFilled: {
    borderColor: Colors.light.accentBlue,
    backgroundColor: Colors.light.lightBlue,
  },
  timerRow: { marginTop: 20, marginBottom: 40 },
  timerText: { ...Typography.body, color: Colors.light.textMuted },
  timerCount: {
    fontFamily: "DMSans_600SemiBold",
    color: Colors.light.primaryBlue,
  },
  resendLink: { ...Typography.bodySemiBold, color: Colors.light.accentBlue },
  btn: { width: "100%", borderRadius: Radii.button, overflow: "hidden" },
  btnGradient: { paddingVertical: 16, alignItems: "center" },
  btnText: { ...Typography.button, color: "#FFFFFF", fontSize: 16 },
});
