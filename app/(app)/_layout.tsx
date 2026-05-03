import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function AppLayout() {
  const { session, isInitialized } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;
    if (!session) {
      router.replace('/(auth)/sign-in');
    }
  }, [session, isInitialized, router]);

  // Show a loading screen while auth initializes to prevent flash
  if (!isInitialized) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.light.primaryBlue, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.light.white} size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
