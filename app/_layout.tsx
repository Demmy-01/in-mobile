import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import {
  Fraunces_700Bold,
  Fraunces_900Black,
} from "@expo-google-fonts/fraunces";
import * as SplashScreen from "expo-splash-screen";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { session, isInitialized, setSession, setInitialized, fetchProfile } =
    useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    Fraunces_700Bold,
    Fraunces_900Black,
  });

  // ── Auth state listener ──────────────────────────────────────────
  useEffect(() => {
    // Get initial session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log(
        "[RootLayout] Initial session:",
        session?.user?.email ?? "none",
      );
      setSession(session);
      setInitialized(true);
      if (session) {
        // Fetch profile after setting session
        fetchProfile().catch((err) => {
          console.error("[RootLayout] Failed to fetch initial profile:", err);
        });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(
        "[RootLayout] Auth state change:",
        event,
        session?.user?.email ?? "none",
      );
      if (event === "SIGNED_OUT") {
        // Clear everything on sign-out
        setSession(null);
      } else if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        setSession(session);
        if (session) {
          // Always fetch profile on any auth state change
          fetchProfile().catch((err) => {
            console.error(
              "[RootLayout] Failed to fetch profile after auth change:",
              err,
            );
          });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession, setInitialized, fetchProfile]);

  // ── Global auth guard ────────────────────────────────────────────
  // Runs whenever session or route changes — kicks unauthenticated
  // users out of protected routes immediately.
  useEffect(() => {
    if (!isInitialized || !fontsLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inAppGroup = segments[0] === "(app)";

    if (!session && inAppGroup) {
      // User is inside the app but has no valid session → sign-in
      router.replace("/(auth)/sign-in");
    } else if (session && inAuthGroup) {
      // Authenticated user is on an auth page → push to app
      router.replace("/(app)/(tabs)/home");
    }
  }, [session, isInitialized, fontsLoaded, segments, router]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}
