import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { View, Image, ImageBackground, Animated, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const router = useRouter();
  const { session, isInitialized } = useAuthStore();
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // Slow, gentle bounce loop
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -18,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [bounceAnim]);

  useEffect(() => {
    if (!isInitialized) return;

    const checkOnboarding = async () => {
      // Always reset onboarding flag so every reload goes through onboarding
      await AsyncStorage.removeItem('has_seen_onboarding');

      // Show splash for at least 2.5 seconds
      await new Promise((resolve) => setTimeout(resolve, 6500));

      if (session) {
        router.replace('/(app)/(tabs)/home');
      } else {
        router.replace('/onboarding');
      }
    };

    checkOnboarding();
  }, [isInitialized, session, router]);

  return (
    <ImageBackground
      source={require('../assets/index-bg.jpg')}
      style={styles.container}
      resizeMode="cover"
      // fallback colour shown while image loads
      imageStyle={{ backgroundColor: '#0D2348' }}
    >
      {/* Bouncing logo */}
      <Animated.View
        style={[
          styles.logoWrapper,
          { transform: [{ translateY: bounceAnim }] },
        ]}
      >
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D2348', // shown instantly while image loads
  },
  logoWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  logo: {
    width: 90,
    height: 90,
  },
});

