import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const router = useRouter();
  const { session, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) return;

    const checkOnboarding = async () => {
      const hasSeenOnboarding = await AsyncStorage.getItem('has_seen_onboarding');

      if (session) {
        router.replace('/(app)/(tabs)/home');
      } else if (!hasSeenOnboarding) {
        router.replace('/onboarding');
      } else {
        router.replace('/(auth)/sign-in');
      }
    };

    checkOnboarding();
  }, [isInitialized, session]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.light.primaryBlue, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color={Colors.light.white} size="large" />
    </View>
  );
}
