import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';

export default function AuthLayout() {
  const { session, isInitialized } = useAuthStore();
  const router = useRouter();

  // If a user is already authenticated, kick them straight into the app.
  // This prevents back-navigation to sign-in/sign-up after logging in.
  useEffect(() => {
    if (!isInitialized) return;
    if (session) {
      router.replace('/(app)/(tabs)/home');
    }
  }, [session, isInitialized, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="notifications-permission" />
      <Stack.Screen name="welcome" />
    </Stack>
  );
}
