import React, { useState, useEffect } from "react";
import { signInWithGoogle } from "@/lib/googleAuth";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { Mail, Key, Eye, EyeOff } from "lucide-react-native";
import Svg, { Path, G, Rect, ClipPath, Defs } from "react-native-svg";
import { useToastStore } from "@/store/toastStore";

type Tab = "sign-in" | "sign-up";

export default function SignInScreen() {
  const router = useRouter();
  const showToast = useToastStore((state) => state.showToast);
  const params = useLocalSearchParams<{ email?: string; message?: string }>();
  const { setSession, fetchProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>("sign-in");
  const [email, setEmail] = useState(params.email ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Show message if coming from OTP redirect
  useEffect(() => {
    if (params.message) {
      showToast(params.message, 'success', 'Email Verified');
    }
  }, [params.message]);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      showToast('Please enter email and password', 'error', 'Validation Error');
      return;
    }
    setIsLoading(true);
    console.log("[SignIn] Attempting login for:", email.trim());

    // Block organisation accounts from signing in as students
    const { data: orgProfile } = await supabase
      .from('organisation_profiles')
      .select('id')
      .eq('email', email.trim())
      .maybeSingle();

    if (orgProfile) {
      setIsLoading(false);
      showToast(
        'This email is registered as an Organisation account. Please use the Organisation Portal to sign in.',
        'error',
        'Wrong Portal'
      );
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setIsLoading(false);
      console.error("[SignIn] Authentication failed:", error.message);
      showToast(error.message, 'error', 'Sign In Failed');
      return;
    }

    console.log("[SignIn] ✅ Authentication successful");

    try {
      // Get the confirmed session after successful sign-in
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error("[SignIn] No session after auth:", sessionError?.message);
        throw new Error(sessionError?.message || "Failed to retrieve session");
      }

      console.log("[SignIn] ✅ Session retrieved for userId:", session.user.id);

      // Update store with session
      setSession(session);
      console.log("[SignIn] Session set in store");

      // Fetch profile data (will be available since user is now authenticated)
      console.log("[SignIn] Fetching profile...");
      await fetchProfile();
      console.log("[SignIn] ✅ Profile fetched successfully");

      setIsLoading(false);

      // Navigate to app home/dashboard
      router.replace("/(app)/(tabs)/home");
    } catch (err: any) {
      setIsLoading(false);
      console.error("[SignIn] Session setup error:", err.message);
      showToast('Could not load your profile. Please try again.', 'error', 'Session Error');
    }
  };

  return (
    <View style={styles.mainContainer}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Gray Header Area */}
          <View style={styles.headerArea}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Enter your credential login</Text>
          </View>

          {/* White Bottom Sheet */}
          <View style={styles.whiteSheet}>
            {/* Tabs */}
            <View style={styles.tabContainer}>
              <View style={styles.tabRow}>
                <TouchableOpacity
                  style={styles.tabItem}
                  onPress={() => setActiveTab("sign-in")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "sign-in" && styles.tabTextActive,
                    ]}
                  >
                    Sign in
                  </Text>
                  {activeTab === "sign-in" && (
                    <View style={styles.activeIndicator} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.tabItem}
                  onPress={() => router.push("/(auth)/sign-up")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "sign-up" && styles.tabTextActive,
                    ]}
                  >
                    Sign up
                  </Text>
                  {activeTab === "sign-up" ? (
                    <View style={styles.activeIndicator} />
                  ) : (
                    <View style={styles.inactiveIndicator} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              {/* Email Input */}
              <View style={styles.inputWrapper}>
                <Mail size={20} color="#000" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#A0A0A0"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputWrapper}>
                <Key size={20} color="#000" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#A0A0A0"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  {showPassword ? (
                    <Eye size={20} color="#A0A0A0" />
                  ) : (
                    <EyeOff size={20} color="#A0A0A0" />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.forgotBtn}
                onPress={() => router.push("/(auth)/forgot-password")}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSignIn}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Sign in</Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Button */}
              <TouchableOpacity
                style={styles.googleBtn}
                activeOpacity={0.8}
                disabled={isGoogleLoading}
                onPress={async () => {
                  setIsGoogleLoading(true);
                  const { error, session } = await signInWithGoogle();
                  setIsGoogleLoading(false);
                  if (error) {
                    showToast(error, 'error', 'Google Sign-In Failed');
                  } else {
                    if (session) {
                      setSession(session);
                      await fetchProfile();
                    }
                    showToast('Successfully authenticated with Google!', 'success', 'Welcome! 🎉');
                    router.replace('/(app)/(tabs)/home');
                  }
                }}
              >
                <Svg width={22} height={22} viewBox="0 0 48 48">
                  <Defs>
                    <ClipPath id="clip">
                      <Rect width={48} height={48} />
                    </ClipPath>
                  </Defs>
                  <G clipPath="url(#clip)">
                    <Path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <Path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <Path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <Path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </G>
                </Svg>
                {isGoogleLoading ? (
                  <ActivityIndicator size="small" color="#1F2937" />
                ) : (
                  <Text style={styles.googleBtnText}>Continue with Google</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#EBEBEB", // Light gray background for the top
  },
  scrollContainer: {
    flexGrow: 1,
  },
  headerArea: {
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Fraunces_900Black", // Bold serif-like font matching screenshot
    fontSize: 28,
    color: "#000",
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: "#8A8A8A",
  },
  whiteSheet: {
    flex: 1,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 40,
  },
  tabContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  tabRow: {
    flexDirection: "row",
    width: "70%",
    justifyContent: "space-between",
  },
  tabItem: {
    alignItems: "center",
    paddingBottom: 8,
    position: "relative",
    width: "45%",
  },
  tabText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 14,
    color: "#000",
  },
  tabTextActive: {
    color: "#000",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 3,
    backgroundColor: "#000",
    borderRadius: 2,
  },
  inactiveIndicator: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 3,
    backgroundColor: "#E6EBF5",
    borderRadius: 2,
  },
  formContainer: {
    gap: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: "#000",
    height: "100%",
  },
  eyeBtn: {
    padding: 8,
  },
  forgotBtn: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
    marginTop: -8,
  },
  forgotText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: "#3B82F6",
  },
  buttonContainer: {
    marginTop: 100,
  },
  submitBtn: {
    backgroundColor: "#1C315E",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  submitBtnText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: "#FFF",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: "#9CA3AF",
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  googleBtnText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
    color: "#1F2937",
  },
});
