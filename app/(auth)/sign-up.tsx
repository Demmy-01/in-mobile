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
});

