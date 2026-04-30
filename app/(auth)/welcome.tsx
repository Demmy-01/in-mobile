import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Typography, Radii } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

export default function WelcomeScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const firstName = profile?.first_name ?? 'there';

  // Confetti dots animation
  const dots = useRef(
    Array.from({ length: 18 }, () => ({
      x: new Animated.Value(Math.random() * 360 - 20),
      y: new Animated.Value(-20),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    dots.forEach((dot, i) => {
      const delay = i * 80;
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(dot.opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.spring(dot.scale, { toValue: 1, useNativeDriver: true }),
          Animated.timing(dot.y, {
            toValue: Math.random() * 600 + 100,
            duration: 1400 + Math.random() * 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(dot.opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    });
  }, []);

  const confettiColors = [
    Colors.light.accentBlue, Colors.light.success, Colors.light.warning,
    Colors.light.primaryBlue, '#F472B6', '#A78BFA',
  ];

  return (
    <View style={styles.container}>
      {/* Confetti */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            style={[
              styles.confettiDot,
              {
                backgroundColor: confettiColors[i % confettiColors.length],
                left: dot.x,
                transform: [{ translateY: dot.y }, { scale: dot.scale }],
                opacity: dot.opacity,
                width: i % 3 === 0 ? 10 : 8,
                height: i % 3 === 0 ? 10 : 8,
                borderRadius: i % 2 === 0 ? 5 : 2,
              },
            ]}
          />
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Logo */}
        <LinearGradient
          colors={[Colors.light.primaryBlue, Colors.light.accentBlue]}
          style={styles.logo}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.logoText}>M</Text>
        </LinearGradient>

        {/* Success ring */}
        <View style={styles.successRing}>
          <View style={styles.successInner}>
            <Text style={styles.checkIcon}>✓</Text>
          </View>
        </View>

        <Text style={styles.title}>You're all set,{'\n'}{firstName}!</Text>
        <Text style={styles.subtitle}>
          Your profile is ready. Let's find your perfect internship.
        </Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { number: '2,400+', label: 'Opportunities' },
            { number: '500+', label: 'Companies' },
            { number: '98%', label: 'Match Rate' },
          ].map((stat, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={styles.statNumber}>{stat.number}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA */}
      <TouchableOpacity
        onPress={() => router.replace('/(app)/(tabs)/home')}
        style={styles.btn}
      >
        <LinearGradient
          colors={[Colors.light.accentBlue, Colors.light.primaryBlue]}
          style={styles.btnGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.btnText}>Go to Home 🚀</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    paddingHorizontal: 28,
    paddingBottom: 48,
    paddingTop: 60,
  },
  confettiDot: {
    position: 'absolute',
    top: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontFamily: 'Fraunces_900Black',
    fontSize: 32,
    color: '#FFFFFF',
  },
  successRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Colors.light.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: `${Colors.light.success}15`,
  },
  successInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.light.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    fontSize: 26,
    color: '#FFFFFF',
    fontFamily: 'DMSans_700Bold',
  },
  title: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 34,
    color: Colors.light.textDark,
    textAlign: 'center',
    lineHeight: 44,
    marginBottom: 14,
  },
  subtitle: {
    ...Typography.bodyLg,
    color: Colors.light.textMuted,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 48,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: Colors.light.lightBlue,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 20,
    color: Colors.light.primaryBlue,
    marginBottom: 4,
  },
  statLabel: {
    ...Typography.label,
    color: Colors.light.textMuted,
  },
  btn: {
    borderRadius: Radii.button,
    overflow: 'hidden',
  },
  btnGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: Radii.button,
  },
  btnText: {
    ...Typography.button,
    color: '#FFFFFF',
    fontSize: 17,
  },
});
