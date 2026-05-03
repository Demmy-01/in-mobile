import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { Colors } from '@/constants/Colors';
import { Typography, Radii } from '@/constants/theme';
import { Bell, Target, ClipboardList, Mic } from 'lucide-react-native';

export default function NotificationsPermissionScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleAllow = async () => {
    setIsLoading(true);
    if (Platform.OS !== 'web') {
      await Notifications.requestPermissionsAsync();
    }
    setIsLoading(false);
    router.replace('/(auth)/welcome');
  };

  const handleSkip = () => {
    router.replace('/(auth)/welcome');
  };

  return (
    <View style={styles.container}>
      {/* Background accent */}
      <View style={styles.bgAccent} />

      {/* Bell icon */}
      <View style={styles.iconWrap}>
        <LinearGradient
          colors={[Colors.light.accentBlue, Colors.light.primaryBlue]}
          style={styles.iconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Bell size={44} color="#FFFFFF" />
        </LinearGradient>
        {/* Notification badge dots */}
        <View style={[styles.badge, { top: 0, right: 4 }]}>
          <Text style={styles.badgeText}>3</Text>
        </View>
      </View>

      {/* Text */}
      <Text style={styles.title}>Stay in the Loop</Text>
      <Text style={styles.subtitle}>
        Get notified when new opportunities match your profile and when applications are reviewed.
      </Text>

      {/* Benefit list */}
      <View style={styles.benefitList}>
        {[
          { Icon: Target, text: 'New internships matching your department' },
          { Icon: ClipboardList, text: 'Application status updates in real-time' },
          { Icon: Mic, text: 'Interview reminders and prep tips' },
        ].map((item, i) => (
          <View key={i} style={styles.benefitItem}>
            <item.Icon size={20} color={Colors.light.accentBlue} />
            <Text style={styles.benefitText}>{item.text}</Text>
          </View>
        ))}
      </View>

      {/* Buttons */}
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          onPress={handleAllow}
          disabled={isLoading}
          style={styles.primaryBtn}
        >
          <LinearGradient
            colors={[Colors.light.accentBlue, Colors.light.primaryBlue]}
            style={styles.primaryBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.primaryBtnText}>Allow Notifications</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkip} style={styles.ghostBtn}>
          <Text style={styles.ghostBtnText}>Maybe Later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgAccent: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.light.lightBlue,
    opacity: 0.5,
  },
  iconWrap: {
    marginBottom: 36,
    position: 'relative',
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellIcon: {
    fontSize: 44,
  },
  badge: {
    position: 'absolute',
    backgroundColor: Colors.light.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
  },
  title: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 32,
    color: Colors.light.textDark,
    textAlign: 'center',
    marginBottom: 14,
  },
  subtitle: {
    ...Typography.bodyLg,
    color: Colors.light.textMuted,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
  },
  benefitList: {
    width: '100%',
    gap: 16,
    marginBottom: 48,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.light.lightBlue,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  benefitText: {
    ...Typography.bodyMedium,
    color: Colors.light.textDark,
    flex: 1,
  },
  buttonGroup: {
    width: '100%',
    gap: 14,
  },
  primaryBtn: {
    borderRadius: Radii.button,
    overflow: 'hidden',
  },
  primaryBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: Radii.button,
  },
  primaryBtnText: {
    ...Typography.button,
    color: '#FFFFFF',
    fontSize: 16,
  },
  ghostBtn: {
    paddingVertical: 15,
    borderRadius: Radii.button,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    alignItems: 'center',
    backgroundColor: Colors.light.white,
  },
  ghostBtnText: {
    ...Typography.button,
    color: Colors.light.textMuted,
    fontSize: 16,
  },
});
