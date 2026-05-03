import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Typography, Radii } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

const COMPLETION_FIELDS = ['first_name', 'last_name', 'email', 'matric_number', 'department', 'level', 'phone', 'bio', 'skills', 'linkedin_url'];

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'applications' | 'saved' | 'cvs'>('applications');

  const firstName = profile?.first_name ?? 'Student';
  const lastName = profile?.last_name ?? '';
  const department = profile?.department ?? 'Computer Science';
  const level = profile?.level ?? '300L';
  const matric = profile?.matric_number ?? 'RUN/CPS/22/00123';

  // Profile completion
  const completedFields = COMPLETION_FIELDS.filter((f) => {
    if (!profile) return false;
    const val = profile[f as keyof typeof profile];
    if (Array.isArray(val)) return val.length > 0;
    return Boolean(val);
  });
  const completionPct = Math.round((completedFields.length / COMPLETION_FIELDS.length) * 100);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => { signOut(); router.replace('/(auth)/sign-in'); } },
      ]
    );
  };

  const SETTINGS = [
    { icon: '🔔', label: 'Notification Preferences', onPress: () => {} },
    { icon: '🔒', label: 'Privacy Settings', onPress: () => {} },
    { icon: '🔑', label: 'Change Password', onPress: () => {} },
    { icon: '❓', label: 'Help & Support', onPress: () => {} },
    { icon: 'ℹ️', label: 'About MIMS', onPress: () => {} },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Profile Header */}
        <LinearGradient
          colors={[Colors.light.primaryBlue, Colors.light.accentBlue]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity style={styles.editBtn}>
            <Text style={styles.editBtnText}>✏️ Edit</Text>
          </TouchableOpacity>

          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{firstName.charAt(0)}</Text>
            </View>
          </View>
          <Text style={styles.profileName}>{firstName} {lastName}</Text>
          <Text style={styles.profileDept}>{department}</Text>
          <View style={styles.profileMeta}>
            <View style={styles.metaBadge}>
              <Text style={styles.metaBadgeText}>{level}</Text>
            </View>
            <View style={styles.metaDot} />
            <Text style={styles.metaText}>{matric}</Text>
          </View>
        </LinearGradient>

        {/* Completion Bar */}
        <View style={styles.completionCard}>
          <View style={styles.completionHeader}>
            <Text style={styles.completionTitle}>Profile Completion</Text>
            <Text style={styles.completionPct}>{completionPct}%</Text>
          </View>
          <View style={styles.completionBar}>
            <View style={[styles.completionFill, { width: `${completionPct}%` }]} />
          </View>
          {completionPct < 100 && (
            <Text style={styles.completionHint}>
              Add more details to improve your internship matches
            </Text>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {([
            ['applications', '📋 Applications'],
            ['saved', '🔖 Saved'],
            ['cvs', '📄 CVs'],
          ] as const).map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[styles.tab, activeTab === key && styles.tabActive]}
              onPress={() => setActiveTab(key)}
            >
              <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'applications' && (
            <View style={styles.emptyTab}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No applications yet</Text>
              <Text style={styles.emptyText}>Start applying to internships from the Search tab</Text>
            </View>
          )}
          {activeTab === 'saved' && (
            <View style={styles.emptyTab}>
              <Text style={styles.emptyIcon}>🔖</Text>
              <Text style={styles.emptyTitle}>No saved jobs</Text>
              <Text style={styles.emptyText}>Bookmark internships to review them later</Text>
            </View>
          )}
          {activeTab === 'cvs' && (
            <View style={styles.emptyTab}>
              <Text style={styles.emptyIcon}>📄</Text>
              <Text style={styles.emptyTitle}>No CVs generated yet</Text>
              <TouchableOpacity style={styles.buildCvBtn} onPress={() => router.push('/(app)/(tabs)/cv-builder')}>
                <Text style={styles.buildCvBtnText}>Build Your First CV →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.settingsTitle}>Settings</Text>
          {SETTINGS.map((item, i) => (
            <TouchableOpacity key={i} style={styles.settingsItem} onPress={item.onPress}>
              <Text style={styles.settingsIcon}>{item.icon}</Text>
              <Text style={styles.settingsLabel}>{item.label}</Text>
              <Text style={styles.settingsArrow}>›</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  headerGradient: { paddingTop: 20, paddingBottom: 32, paddingHorizontal: 20, alignItems: 'center', position: 'relative' },
  editBtn: {
    position: 'absolute', top: 20, right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  editBtnText: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#FFFFFF' },
  avatarContainer: { marginBottom: 12 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFFFFF',
  },
  avatarText: { fontFamily: 'DMSans_700Bold', fontSize: 32, color: '#FFFFFF' },
  profileName: { fontFamily: 'Fraunces_700Bold', fontSize: 24, color: '#FFFFFF', marginBottom: 4 },
  profileDept: { ...Typography.body, color: 'rgba(255,255,255,0.8)', marginBottom: 12 },
  profileMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  metaBadgeText: { fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: '#FFFFFF' },
  metaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.5)' },
  metaText: { ...Typography.label, color: 'rgba(255,255,255,0.8)' },

  // Completion
  completionCard: {
    marginHorizontal: 20, marginTop: -20, backgroundColor: Colors.light.white,
    borderRadius: Radii.card, padding: 18, borderWidth: 1, borderColor: Colors.light.cardBorder,
    marginBottom: 20,
  },
  completionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  completionTitle: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.light.textDark },
  completionPct: { fontFamily: 'DMSans_700Bold', fontSize: 16, color: Colors.light.accentBlue },
  completionBar: {
    height: 8, backgroundColor: Colors.light.lightBlue,
    borderRadius: 4, overflow: 'hidden', marginBottom: 8,
  },
  completionFill: { height: '100%', backgroundColor: Colors.light.accentBlue, borderRadius: 4 },
  completionHint: { ...Typography.micro, color: Colors.light.textMuted },

  // Tabs
  tabRow: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 4,
    borderRadius: Radii.md, backgroundColor: Colors.light.surfaceGrey, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.light.white },
  tabText: { ...Typography.labelSemiBold, color: Colors.light.textMuted },
  tabTextActive: { color: Colors.light.textDark },
  tabContent: { minHeight: 150 },
  emptyTab: { alignItems: 'center', paddingVertical: 40, gap: 8, paddingHorizontal: 20 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: Colors.light.textDark },
  emptyText: { ...Typography.body, color: Colors.light.textMuted, textAlign: 'center' },
  buildCvBtn: {
    paddingHorizontal: 24, paddingVertical: 10, borderRadius: Radii.button,
    backgroundColor: Colors.light.primaryBlue, marginTop: 8,
  },
  buildCvBtnText: { ...Typography.button, color: '#FFFFFF' },

  // Settings
  settingsSection: { marginTop: 24, marginHorizontal: 20 },
  settingsTitle: { fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: Colors.light.textDark, marginBottom: 12 },
  settingsItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.light.borderLight,
  },
  settingsIcon: { fontSize: 20, width: 28 },
  settingsLabel: { flex: 1, ...Typography.body, color: Colors.light.textDark },
  settingsArrow: { fontSize: 20, color: Colors.light.textMuted },
  signOutBtn: { marginTop: 24, paddingVertical: 16, alignItems: 'center' },
  signOutText: { fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.light.error },
});
