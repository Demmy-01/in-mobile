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

  // Block ALL rendering until auth is resolved — no flash of protected content
  if (!isInitialized || !session) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.light.primaryBlue, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.light.white} size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="apply" />
    </Stack>
  );
}
