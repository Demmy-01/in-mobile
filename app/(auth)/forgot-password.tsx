import { MATRIC_REGEX } from "@/constants/AppData";
import { Colors } from "@/constants/Colors";
import { Radii, Typography } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [matricNumber, setMatricNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const isValid = MATRIC_REGEX.test(matricNumber.trim().toUpperCase());

  const handleSend = async () => {
    if (!isValid) {
      setError("Format: RUN/DEPT/YY/XXXXX");
      return;
    }
    setError("");
    setIsLoading(true);

    // Look up email by matric number from our profiles table
    const { data, error: fetchError } = await supabase
      .from("student_profiles")
      .select("email")
      .eq("matric_number", matricNumber.trim().toUpperCase())
      .single();

    if (fetchError || !data) {
      setIsLoading(false);
      setError("No account found with this matric number");
      return;
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      data.email,
    );
    setIsLoading(false);
    if (resetError) {
      Alert.alert("Error", resetError.message);
    } else {
      setSent(true);
    }
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

        {sent ? (
          <View style={styles.successState}>
            <View style={styles.successIcon}>
              <Text style={{ fontSize: 48 }}>✅</Text>
            </View>
            <Text style={styles.title}>Reset Link Sent!</Text>
            <Text style={styles.subtitle}>
              Check your registered email address for the password reset link.
            </Text>
            <TouchableOpacity
              onPress={() => router.replace("/(auth)/sign-in")}
              style={styles.btn}
            >
              <LinearGradient
                colors={[Colors.light.accentBlue, Colors.light.primaryBlue]}
                style={styles.btnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.btnText}>Back to Sign In</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.iconBg}>
              <Text style={{ fontSize: 36 }}>🔐</Text>
            </View>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your matric number and we'll send a reset link to your
              registered email address.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Matric Number</Text>
              <View
                style={[
                  styles.inputWrapper,
                  error
                    ? styles.inputError
                    : isValid
                      ? styles.inputSuccess
                      : null,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="RUN/CPS/22/00123"
                  placeholderTextColor={Colors.light.placeholder}
                  value={matricNumber}
                  onChangeText={(t) => {
                    setMatricNumber(t);
                    setError("");
                  }}
                  autoCapitalize="characters"
                />
                {isValid && <Text style={styles.checkmark}>✓</Text>}
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            <Text style={styles.hint}>
              A reset link will be sent to your registered email address
            </Text>

            <TouchableOpacity
              onPress={handleSend}
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
                  <Text style={styles.btnText}>Send Reset Link</Text>
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
  inputError: { borderColor: Colors.light.error },
  inputSuccess: { borderColor: Colors.light.success },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.light.textDark,
    paddingVertical: 14,
  },
  checkmark: { color: Colors.light.success, fontSize: 16 },
  errorText: { ...Typography.micro, color: Colors.light.error },
  hint: {
    ...Typography.micro,
    color: Colors.light.textMuted,
    marginTop: 8,
    marginBottom: 32,
  },
  btn: { borderRadius: Radii.button, overflow: "hidden", marginTop: 32 },
  btnGradient: { paddingVertical: 16, alignItems: "center" },
  btnText: { ...Typography.button, color: "#FFFFFF", fontSize: 16 },
  successState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  successIcon: { marginBottom: 8 },
});
