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
import { supabase } from '@/lib/supabase';
import { User, IdCard, Mail, Key, Eye, EyeOff, Check } from 'lucide-react-native';
import Svg, { Path, G, Rect, ClipPath, Defs } from 'react-native-svg';

type Tab = 'sign-in' | 'sign-up';

export default function SignUpScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('sign-up');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    if (!firstName.trim() || !lastName.trim() || !matricNumber.trim() || !email.trim() || !password) {
      Alert.alert('Validation Error', 'Please fill in all fields');
      return;
    }
    if (!agreed) {
      Alert.alert('Validation Error', 'You must agree to the terms and conditions');
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          matric_number: matricNumber.trim().toUpperCase(),
          // Omitted department and level to match the new UI.
        },
      },
    });

    setIsLoading(false);

    if (error) {
      Alert.alert('Registration Failed', error.message);
    } else if (data?.user) {
      // Pass required params to OTP screen
      router.push({ pathname: '/(auth)/otp', params: { email: email.trim(), firstName: firstName.trim() } });
    }
  };

  return (
    <View style={styles.mainContainer}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} bounces={false}>
          
          {/* Gray Header Area */}
          <View style={styles.headerArea}>
            <Text style={styles.title}>Registration</Text>
            <Text style={styles.subtitle}>Fill your account details</Text>
          </View>

          {/* White Bottom Sheet */}
          <View style={styles.whiteSheet}>
            
            {/* Tabs */}
            <View style={styles.tabContainer}>
              <View style={styles.tabRow}>
                <TouchableOpacity
                  style={styles.tabItem}
                  onPress={() => router.push('/(auth)/sign-in')}
                >
                  <Text style={[styles.tabText, activeTab === 'sign-in' && styles.tabTextActive]}>Sign in</Text>
                  {activeTab === 'sign-in' ? <View style={styles.activeIndicator} /> : <View style={styles.inactiveIndicator} />}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.tabItem}
                  onPress={() => setActiveTab('sign-up')}
                >
                  <Text style={[styles.tabText, activeTab === 'sign-up' && styles.tabTextActive]}>Sign up</Text>
                  {activeTab === 'sign-up' && <View style={styles.activeIndicator} />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              
              {/* First Name Input */}
              <View style={styles.inputWrapper}>
                <User size={18} color="#000" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="First name"
                  placeholderTextColor="#A0A0A0"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>

              {/* Last Name Input */}
              <View style={styles.inputWrapper}>
                <User size={18} color="#000" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Last name"
                  placeholderTextColor="#A0A0A0"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>

              {/* Matric Number Input */}
              <View style={styles.inputWrapper}>
                <IdCard size={18} color="#000" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Matric_No"
                  placeholderTextColor="#A0A0A0"
                  value={matricNumber}
                  onChangeText={setMatricNumber}
                  autoCapitalize="characters"
                />
              </View>
              {/* Email Input */}
              <View style={styles.inputWrapper}>
                <Mail size={18} color="#000" style={styles.inputIcon} />
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
                <Key size={18} color="#000" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#A0A0A0"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  {showPassword ? <Eye size={20} color="#A0A0A0" /> : <EyeOff size={20} color="#A0A0A0" />}
                </TouchableOpacity>
              </View>

              {/* Terms Checkbox */}
              <TouchableOpacity style={styles.checkboxContainer} onPress={() => setAgreed(!agreed)} activeOpacity={0.7}>
                <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                  {agreed && <Check size={14} color="#FFF" />}
                </View>
                <Text style={styles.checkboxText}>I agree to the terms & condition</Text>
              </TouchableOpacity>

            </View>

            {/* Submit Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSignUp}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Sign up</Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Button */}
              <TouchableOpacity style={styles.googleBtn} activeOpacity={0.8}>
                <Svg width={22} height={22} viewBox="0 0 48 48">
                  <Defs>
                    <ClipPath id="clip">
                      <Rect width={48} height={48} />
                    </ClipPath>
                  </Defs>
                  <G clipPath="url(#clip)">
                    <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </G>
                </Svg>
                <Text style={styles.googleBtnText}>Continue with Google</Text>
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
    backgroundColor: '#EBEBEB',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  headerArea: {
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Fraunces_900Black',
    fontSize: 28,
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: '#8A8A8A',
  },
  whiteSheet: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 40,
  },
  tabContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  tabRow: {
    flexDirection: 'row',
    width: '70%',
    justifyContent: 'space-between',
  },
  tabItem: {
    alignItems: 'center',
    paddingBottom: 8,
    position: 'relative',
    width: '45%',
  },
  tabText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: '#000',
  },
  tabTextActive: {
    color: '#000',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 3,
    backgroundColor: '#000',
    borderRadius: 2,
  },
  inactiveIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 3,
    backgroundColor: '#E6EBF5',
    borderRadius: 2,
  },
  formContainer: {
    gap: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: '#000',
    height: '100%',
  },
  eyeBtn: {
    padding: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
  },
  checkboxText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: '#3B82F6',
  },
  buttonContainer: {
    marginTop: 40,
  },
  submitBtn: {
    backgroundColor: '#1C315E',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: '#FFF',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: '#9CA3AF',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  googleBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: '#1F2937',
  },
});

