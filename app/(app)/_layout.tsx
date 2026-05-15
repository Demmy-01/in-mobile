import { Stack } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function AppLayout() {
  const { session, isInitialized } = useAuthStore();

  // Show spinner while auth is being resolved.
  // The root _layout.tsx handles ALL redirects — no duplicate redirect here.
  if (!isInitialized) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.light.primaryBlue, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  // If no session, show nothing — root layout will redirect to sign-in
  if (!session) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="apply" />
    </Stack>
  );
}
