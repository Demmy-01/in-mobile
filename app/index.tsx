import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { View, Image, Animated, StyleSheet, Dimensions } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

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
  }, [isInitialized, session, router]);

  return (
    <View style={styles.container}>
      {/* Geometric pattern overlay */}
      <View style={styles.patternOverlay} pointerEvents="none">
        {Array.from({ length: 12 }).map((_, row) =>
          Array.from({ length: 8 }).map((_, col) => (
            <View
              key={`${row}-${col}`}
              style={[
                styles.patternTile,
                {
                  left: col * 52 - 10,
                  top: row * 52 - 10,
                },
              ]}
            >
              {/* Top-left L shape */}
              <View style={[styles.patternLine, { width: 22, height: 3, top: 4, left: 4 }]} />
              <View style={[styles.patternLine, { width: 3, height: 22, top: 4, left: 4 }]} />
              {/* Bottom-right L shape */}
              <View style={[styles.patternLine, { width: 22, height: 3, bottom: 4, right: 4 }]} />
              <View style={[styles.patternLine, { width: 3, height: 22, bottom: 4, right: 4 }]} />
              {/* Small dot */}
              <View style={styles.patternDot} />
            </View>
          ))
        )}
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A3A6B',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
  },
  patternTile: {
    position: 'absolute',
    width: 50,
    height: 50,
  },
  patternLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 2,
  },
  patternDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    top: '50%',
    left: '50%',
    marginTop: -2,
    marginLeft: -2,
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

