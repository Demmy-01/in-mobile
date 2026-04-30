import React, { useState } from 'react';
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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Typography, Radii } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

type Tab = 'sign-in' | 'sign-up';

export default function SignInScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validate()) return;
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setIsLoading(false);
    if (error) {
      Alert.alert('Sign In Failed', error.message);
    } else {
      router.replace('/(app)/(tabs)/home');
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) Alert.alert('Error', error.message);
  };

  const isEmailValid = email.length > 0 && /\S+@\S+\.\S+/.test(email);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.light.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={[Colors.light.primaryBlue, Colors.light.accentBlue]}
            style={styles.logoMark}
          >
            <Text style={styles.logoText}>M</Text>
          </LinearGradient>
          <Text style={styles.brandName}>InternLink</Text>
          <Text style={styles.brandSub}>The Seamless Internship Experience</Text>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabRow}>
          {(['sign-in', 'sign-up'] as Tab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={styles.tabItem}
              onPress={() => {
                if (tab === 'sign-up') router.push('/(auth)/sign-up');
                else setActiveTab(tab);
              }}
            >
              <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                {tab === 'sign-in' ? 'Sign In' : 'Sign Up'}
              </Text>
              {activeTab === tab && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={[
              styles.inputWrapper,
              errors.email ? styles.inputError : isEmailValid ? styles.inputSuccess : null,
            ]}>
              <TextInput
                style={styles.input}
                placeholder="you@redeemers.edu.ng"
                placeholderTextColor={Colors.light.placeholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              {isEmailValid && <Text style={styles.checkmark}>✓</Text>}
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                <Text style={styles.forgotLink}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Enter your password"
                placeholderTextColor={Colors.light.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            onPress={handleSignIn}
            disabled={isLoading}
            style={styles.primaryBtn}
          >
            <LinearGradient
              colors={[Colors.light.accentBlue, Colors.light.primaryBlue]}
              style={styles.primaryBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.primaryBtnText}>Sign In</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google */}
          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn}>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontFamily: 'Fraunces_900Black',
    fontSize: 28,
    color: '#FFFFFF',
  },
  brandName: {
    fontFamily: 'Fraunces_900Black',
    fontSize: 28,
    color: Colors.light.primaryBlue,
    letterSpacing: 2,
  },
  brandSub: {
    ...Typography.label,
    color: Colors.light.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    marginBottom: 32,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 12,
    position: 'relative',
  },
  tabLabel: {
    ...Typography.bodySemiBold,
    color: Colors.light.textMuted,
  },
  tabLabelActive: {
    color: Colors.light.primaryBlue,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: -1,
    left: '15%',
    right: '15%',
    height: 2,
    backgroundColor: Colors.light.primaryBlue,
    borderRadius: 1,
  },
  form: {
    gap: 20,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    ...Typography.labelSemiBold,
    color: Colors.light.textDark,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotLink: {
    ...Typography.label,
    color: Colors.light.accentBlue,
    fontFamily: 'DMSans_600SemiBold',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.inputBg,
    borderWidth: 1.5,
    borderColor: Colors.light.inputBorder,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  inputError: {
    borderColor: Colors.light.error,
  },
  inputSuccess: {
    borderColor: Colors.light.success,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.light.textDark,
    paddingVertical: 14,
  },
  checkmark: {
    color: Colors.light.success,
    fontSize: 16,
    fontFamily: 'DMSans_600SemiBold',
  },
  eyeBtn: {
    padding: 4,
  },
  eyeIcon: {
    fontSize: 18,
  },
  errorText: {
    ...Typography.micro,
    color: Colors.light.error,
    marginTop: 2,
  },
  primaryBtn: {
    borderRadius: Radii.button,
    overflow: 'hidden',
    marginTop: 8,
  },
  primaryBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: Radii.button,
  },
  primaryBtnText: {
    ...Typography.button,
    color: '#FFFFFF',
    fontSize: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.border,
  },
  dividerText: {
    ...Typography.label,
    color: Colors.light.textMuted,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: Radii.button,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.white,
  },
  googleIcon: {
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
    color: Colors.light.accentBlue,
  },
  googleText: {
    ...Typography.button,
    color: Colors.light.textDark,
  },
});
