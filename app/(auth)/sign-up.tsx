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
import { DEPARTMENTS, LEVELS, MATRIC_REGEX } from '@/constants/AppData';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  matricNumber: string;
  department: string;
  level: string;
  password: string;
  confirmPassword: string;
  agreed: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  matricNumber?: string;
  department?: string;
  level?: string;
  password?: string;
  confirmPassword?: string;
  agreed?: string;
}

export default function SignUpScreen() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    firstName: '', lastName: '', email: '', matricNumber: '',
    department: '', level: '', password: '', confirmPassword: '', agreed: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeptPicker, setShowDeptPicker] = useState(false);
  const [showLevelPicker, setShowLevelPicker] = useState(false);

  const update = (key: keyof FormData, value: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }));
    // Clear error on edit
    if (errors[key as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Valid email is required';
    if (!MATRIC_REGEX.test(form.matricNumber)) newErrors.matricNumber = 'Format: RUN/DEPT/YY/XXXXX';
    if (!form.department) newErrors.department = 'Select your department';
    if (!form.level) newErrors.level = 'Select your level';
    if (form.password.length < 8) newErrors.password = 'Minimum 8 characters';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!form.agreed) newErrors.agreed = 'You must accept the terms';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setIsLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          matric_number: form.matricNumber.trim().toUpperCase(),
          department: form.department,
          level: form.level,
        },
      },
    });

    setIsLoading(false);

    if (error) {
      Alert.alert('Registration Failed', error.message);
    } else if (data?.user) {
      router.push({ pathname: '/(auth)/otp', params: { email: form.email, firstName: form.firstName } });
    }
  };

  const isValid = (field: keyof FormErrors) => !errors[field] && form[field as keyof FormData];

  type InputFieldProps = {
    label: string;
    field: keyof FormErrors;
    placeholder: string;
    keyboardType?: string;
    secureTextEntry?: boolean;
    showToggle?: boolean;
    onToggle?: () => void;
    multiline?: boolean;
  };

  const InputField = ({
    label, field, placeholder, keyboardType, secureTextEntry, showToggle, onToggle, multiline,
  }: InputFieldProps) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[
        styles.inputWrapper,
        errors[field] ? styles.inputError : isValid(field) ? styles.inputSuccess : null,
      ]}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder={placeholder}
          placeholderTextColor={Colors.light.placeholder}
          value={form[field as keyof FormData] as string}
          onChangeText={(v) => update(field, v)}
          keyboardType={(keyboardType as any) || 'default'}
          secureTextEntry={secureTextEntry}
          autoCapitalize={field === 'email' ? 'none' : 'words'}
          multiline={multiline}
        />
        {showToggle && (
          <TouchableOpacity onPress={onToggle} style={styles.eyeBtn}>
            <Text>{secureTextEntry ? '👁' : '🙈'}</Text>
          </TouchableOpacity>
        )}
        {isValid(field) && !showToggle && <Text style={styles.checkmark}>✓</Text>}
      </View>
      {errors[field] ? <Text style={styles.errorText}>{errors[field]}</Text> : null}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.light.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient colors={[Colors.light.primaryBlue, Colors.light.accentBlue]} style={styles.logoMark}>
            <Text style={styles.logoText}>M</Text>
          </LinearGradient>
          <Text style={styles.brandName}>Create Account</Text>
          <Text style={styles.brandSub}>Join thousands of RUN students</Text>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabRow}>
          <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/(auth)/sign-in')}>
            <Text style={styles.tabLabel}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem}>
            <Text style={[styles.tabLabel, styles.tabLabelActive]}>Sign Up</Text>
            <View style={styles.tabUnderline} />
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Name Row */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <InputField label="First Name" field="firstName" placeholder="Adebayo" />
            </View>
            <View style={{ flex: 1 }}>
              <InputField label="Last Name" field="lastName" placeholder="Okafor" />
            </View>
          </View>

          <InputField label="Email Address" field="email" placeholder="you@redeemers.edu.ng" keyboardType="email-address" />
          <InputField label="Matric Number" field="matricNumber" placeholder="RUN/CPS/22/00123" />

          {/* Department Picker */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Department</Text>
            <TouchableOpacity
              style={[styles.inputWrapper, errors.department && styles.inputError]}
              onPress={() => setShowDeptPicker(!showDeptPicker)}
            >
              <Text style={[styles.input, { flex: 1, color: form.department ? Colors.light.textDark : Colors.light.placeholder }]}>
                {form.department || 'Select your department'}
              </Text>
              <Text style={styles.dropdownArrow}>{showDeptPicker ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {errors.department && <Text style={styles.errorText}>{errors.department}</Text>}
            {showDeptPicker && (
              <View style={styles.dropdownList}>
                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                  {DEPARTMENTS.map((dept) => (
                    <TouchableOpacity
                      key={dept}
                      style={styles.dropdownItem}
                      onPress={() => { update('department', dept); setShowDeptPicker(false); }}
                    >
                      <Text style={[styles.dropdownItemText, form.department === dept && { color: Colors.light.accentBlue }]}>
                        {dept}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Level Picker */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Level</Text>
            <View style={styles.levelRow}>
              {LEVELS.map((lvl) => (
                <TouchableOpacity
                  key={lvl}
                  style={[styles.levelChip, form.level === lvl && styles.levelChipActive]}
                  onPress={() => update('level', lvl)}
                >
                  <Text style={[styles.levelChipText, form.level === lvl && styles.levelChipTextActive]}>
                    {lvl}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.level && <Text style={styles.errorText}>{errors.level}</Text>}
          </View>

          <InputField
            label="Password" field="password" placeholder="Min. 8 characters"
            secureTextEntry={!showPassword} showToggle onToggle={() => setShowPassword(!showPassword)}
          />
          <InputField
            label="Confirm Password" field="confirmPassword" placeholder="Re-enter password"
            secureTextEntry={!showConfirm} showToggle onToggle={() => setShowConfirm(!showConfirm)}
          />

          {/* Terms */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => update('agreed', !form.agreed)}
          >
            <View style={[styles.checkbox, form.agreed && styles.checkboxChecked]}>
              {form.agreed && <Text style={styles.checkboxTick}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.termsLink}>Terms & Conditions</Text>
              {' '}and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>
          {errors.agreed && <Text style={styles.errorText}>{errors.agreed}</Text>}

          {/* Submit */}
          <TouchableOpacity onPress={handleSignUp} disabled={isLoading} style={styles.primaryBtn}>
            <LinearGradient
              colors={[Colors.light.accentBlue, Colors.light.primaryBlue]}
              style={styles.primaryBtnGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.primaryBtnText}>Create Account</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: 36 },
  logoMark: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  logoText: { fontFamily: 'Fraunces_900Black', fontSize: 28, color: '#FFFFFF' },
  brandName: { fontFamily: 'Fraunces_700Bold', fontSize: 26, color: Colors.light.primaryBlue },
  brandSub: { ...Typography.label, color: Colors.light.textMuted, marginTop: 4 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.light.border, marginBottom: 28 },
  tabItem: { flex: 1, alignItems: 'center', paddingBottom: 12, position: 'relative' },
  tabLabel: { ...Typography.bodySemiBold, color: Colors.light.textMuted },
  tabLabelActive: { color: Colors.light.primaryBlue },
  tabUnderline: { position: 'absolute', bottom: -1, left: '15%', right: '15%', height: 2, backgroundColor: Colors.light.primaryBlue, borderRadius: 1 },
  form: { gap: 16 },
  row: { flexDirection: 'row', gap: 12 },
  fieldGroup: { gap: 6 },
  label: { ...Typography.labelSemiBold, color: Colors.light.textDark },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.light.inputBg, borderWidth: 1.5,
    borderColor: Colors.light.inputBorder, borderRadius: Radii.md,
    paddingHorizontal: 14, minHeight: 52,
  },
  inputError: { borderColor: Colors.light.error },
  inputSuccess: { borderColor: Colors.light.success },
  input: { ...Typography.body, color: Colors.light.textDark, paddingVertical: 14 },
  eyeBtn: { padding: 4 },
  checkmark: { color: Colors.light.success, fontSize: 16, fontFamily: 'DMSans_600SemiBold' },
  errorText: { ...Typography.micro, color: Colors.light.error, marginTop: 2 },
  dropdownArrow: { color: Colors.light.textMuted, fontSize: 12 },
  dropdownList: {
    backgroundColor: Colors.light.white, borderWidth: 1, borderColor: Colors.light.border,
    borderRadius: Radii.md, marginTop: 4, overflow: 'hidden',
  },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.light.borderLight },
  dropdownItemText: { ...Typography.body, color: Colors.light.textDark },
  levelRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  levelChip: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: Radii.chip,
    borderWidth: 1.5, borderColor: Colors.light.primaryBlue, backgroundColor: Colors.light.white,
  },
  levelChipActive: { backgroundColor: Colors.light.primaryBlue },
  levelChipText: { ...Typography.labelSemiBold, color: Colors.light.primaryBlue },
  levelChipTextActive: { color: '#FFFFFF' },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkbox: {
    width: 20, height: 20, borderRadius: 6, borderWidth: 2,
    borderColor: Colors.light.primaryBlue, justifyContent: 'center', alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: Colors.light.primaryBlue },
  checkboxTick: { color: '#FFFFFF', fontSize: 12, fontFamily: 'DMSans_700Bold' },
  termsText: { ...Typography.body, color: Colors.light.textMuted, flex: 1, lineHeight: 22 },
  termsLink: { color: Colors.light.accentBlue, fontFamily: 'DMSans_600SemiBold' },
  primaryBtn: { borderRadius: Radii.button, overflow: 'hidden', marginTop: 8 },
  primaryBtnGradient: { paddingVertical: 16, alignItems: 'center', borderRadius: Radii.button },
  primaryBtnText: { ...Typography.button, color: '#FFFFFF', fontSize: 16 },
});
