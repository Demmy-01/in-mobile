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
import { Mail, Key, Eye, EyeOff } from 'lucide-react-native';

type Tab = 'sign-in' | 'sign-up';

export default function SignInScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Validation Error', 'Please enter email and password');
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setIsLoading(false);
    if (error) {
      Alert.alert('Sign In Failed', error.message);
    } else {
      router.replace('/(app)/(tabs)/home');
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
                  onPress={() => setActiveTab('sign-in')}
                >
                  <Text style={[styles.tabText, activeTab === 'sign-in' && styles.tabTextActive]}>Sign in</Text>
                  {activeTab === 'sign-in' && <View style={styles.activeIndicator} />}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.tabItem}
                  onPress={() => router.push('/(auth)/sign-up')}
                >
                  <Text style={[styles.tabText, activeTab === 'sign-up' && styles.tabTextActive]}>Sign up</Text>
                  {activeTab === 'sign-up' ? <View style={styles.activeIndicator} /> : <View style={styles.inactiveIndicator} />}
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
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  {showPassword ? <Eye size={20} color="#A0A0A0" /> : <EyeOff size={20} color="#A0A0A0" />}
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.forgotBtn} onPress={() => router.push('/(auth)/forgot-password')}>
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
    backgroundColor: '#EBEBEB', // Light gray background for the top
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
    fontFamily: 'Fraunces_900Black', // Bold serif-like font matching screenshot
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
  forgotBtn: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    marginTop: -8,
  },
  forgotText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: '#3B82F6',
  },
  buttonContainer: {
    marginTop: 100, // Push button down like in screenshot
  },
  submitBtn: {
    backgroundColor: '#1C315E', // Dark blue from screenshot
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

