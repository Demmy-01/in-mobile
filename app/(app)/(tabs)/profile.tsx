import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Pencil, Bell, Lock, Key, HelpCircle, Info, LogOut,
  ChevronRight, FileText, Bookmark, List, Trash2,
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Typography, Radii } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import EditProfileModal from '@/components/EditProfileModal';
import {
  NotificationsModal, PrivacyModal, ChangePasswordModal, HelpModal, AboutModal,
} from '@/components/SettingsModals';

const C = Colors.light;

const COMPLETION_FIELDS = [
  'first_name', 'last_name', 'email', 'matric_number',
  'department', 'level', 'phone', 'bio', 'skills', 'linkedin_url',
];

interface MiniApplication {
  id: string;
  status: string;
  applied_at: string;
  internship_listings: { title: string; organisation_profiles: { name: string } | null } | null;
}

interface SavedItem {
  id: string;
  listing_id: string;
  saved_at: string;
  internship_listings: { title: string; organisation_profiles: { name: string } | null } | null;
}

interface CvProfile {
  id: string;
  target_role: string | null;
  template_id: string | null;
  generated_at: string | null;
  skills: string[];
}

const STATUS_COLORS: Record<string, string> = {
  Pending: C.warning,
  Reviewed: C.accentBlue,
  Accepted: C.success,
  Rejected: C.error,
};

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'applications' | 'saved' | 'cvs'>('applications');
  const [recentApps, setRecentApps] = useState<MiniApplication[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [cvProfile, setCvProfile] = useState<CvProfile | null>(null);
  const [isLoadingTab, setIsLoadingTab] = useState(false);

  // Modal states
  const [editVisible, setEditVisible] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(false);

  const firstName = profile?.first_name ?? 'Student';
  const lastName = profile?.last_name ?? '';
  const department = profile?.department ?? '—';
  const level = profile?.level ?? '—';
  const matric = profile?.matric_number ?? 'No matric set';
  const bio = profile?.bio;
  const skills = profile?.skills ?? [];

  const completedFields = COMPLETION_FIELDS.filter((f) => {
    if (!profile) return false;
    const val = profile[f as keyof typeof profile];
    if (Array.isArray(val)) return val.length > 0;
    return Boolean(val);
  });
  const completionPct = Math.round((completedFields.length / COMPLETION_FIELDS.length) * 100);

  const fetchTabData = useCallback(async () => {
    if (!profile?.id) return;
    setIsLoadingTab(true);
    const [appsRes, savedRes, cvRes] = await Promise.all([
      supabase
        .from('applications')
        .select('id, status, applied_at, internship_listings(title, organisation_profiles(name))')
        .eq('student_id', profile.id)
        .order('applied_at', { ascending: false })
        .limit(5),
      supabase
        .from('saved_listings')
        .select('id, listing_id, saved_at, internship_listings(title, organisation_profiles(name))')
        .eq('student_id', profile.id)
        .order('saved_at', { ascending: false })
        .limit(5),
      supabase
        .from('cv_profiles')
        .select('id, target_role, template_id, generated_at, skills')
        .eq('student_id', profile.id)
        .maybeSingle(),
    ]);
    if (appsRes.data) setRecentApps(appsRes.data as MiniApplication[]);
    if (savedRes.data) setSavedItems(savedRes.data as SavedItem[]);
    if (cvRes.data) setCvProfile(cvRes.data as CvProfile);
    setIsLoadingTab(false);
  }, [profile?.id]);

  useEffect(() => { fetchTabData(); }, [fetchTabData]);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => { signOut(); router.replace('/(auth)/sign-in'); } },
    ]);
  };

  const unsaveListing = async (savedId: string) => {
    await supabase.from('saved_listings').delete().eq('id', savedId);
    setSavedItems((prev) => prev.filter((s) => s.id !== savedId));
  };

  const SETTINGS = [
    { icon: Bell, label: 'Notification Preferences', onPress: () => setNotifVisible(true) },
    { icon: Lock, label: 'Privacy Settings', onPress: () => setPrivacyVisible(true) },
    { icon: Key, label: 'Change Password', onPress: () => setPasswordVisible(true) },
    { icon: HelpCircle, label: 'Help & Support', onPress: () => setHelpVisible(true) },
    { icon: Info, label: 'About MIMS', onPress: () => setAboutVisible(true) },
  ];

  const TABS: { key: 'applications' | 'saved' | 'cvs'; icon: React.ReactNode; label: string }[] = [
    { key: 'applications', icon: <List size={14} color={activeTab === 'applications' ? C.textDark : C.textMuted} />, label: 'Applications' },
    { key: 'saved', icon: <Bookmark size={14} color={activeTab === 'saved' ? C.textDark : C.textMuted} />, label: 'Saved' },
    { key: 'cvs', icon: <FileText size={14} color={activeTab === 'cvs' ? C.textDark : C.textMuted} />, label: 'CVs' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <LinearGradient
          colors={[C.primaryBlue, C.accentBlue]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditVisible(true)}>
            <Pencil size={13} color="#fff" />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>

          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
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

          {bio ? (
            <Text style={styles.profileBio} numberOfLines={2}>{bio}</Text>
          ) : null}

          {skills.length > 0 && (
            <View style={styles.skillsRow}>
              {skills.slice(0, 4).map((sk) => (
                <View key={sk} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{sk}</Text>
                </View>
              ))}
              {skills.length > 4 && (
                <View style={styles.skillChip}>
                  <Text style={styles.skillChipText}>+{skills.length - 4}</Text>
                </View>
              )}
            </View>
          )}
        </LinearGradient>

        {/* ── Completion Bar ── */}
        <View style={styles.completionCard}>
          <View style={styles.completionHeader}>
            <Text style={styles.completionTitle}>Profile Completion</Text>
            <Text style={styles.completionPct}>{completionPct}%</Text>
          </View>
          <View style={styles.completionBar}>
            <View style={[styles.completionFill, { width: `${completionPct}%` }]} />
          </View>
          {completionPct < 100 && (
            <TouchableOpacity onPress={() => setEditVisible(true)}>
              <Text style={styles.completionHint}>
                {completedFields.length}/{COMPLETION_FIELDS.length} fields complete — tap to finish your profile
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{recentApps.length}</Text>
            <Text style={styles.statLabel}>Applications</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{savedItems.length}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{cvProfile ? 1 : 0}</Text>
            <Text style={styles.statLabel}>CVs</Text>
          </View>
        </View>

        {/* ── Tabs ── */}
        <View style={styles.tabRow}>
          {TABS.map(({ key, icon, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.tab, activeTab === key && styles.tabActive]}
              onPress={() => setActiveTab(key)}
            >
              {icon}
              <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Tab Content ── */}
        <View style={styles.tabContent}>
          {isLoadingTab ? (
            <View style={styles.tabLoading}>
              <ActivityIndicator size="small" color={C.primaryBlue} />
            </View>
          ) : (
            <>
              {/* Applications */}
              {activeTab === 'applications' && (
                recentApps.length === 0 ? (
                  <View style={styles.emptyTab}>
                    <List size={40} color={C.textMuted} />
                    <Text style={styles.emptyTitle}>No applications yet</Text>
                    <Text style={styles.emptyText}>Start applying to internships from the Search tab</Text>
                  </View>
                ) : (
                  <View style={styles.miniList}>
                    {recentApps.map((app) => {
                      const statusColor = STATUS_COLORS[app.status] ?? C.textMuted;
                      return (
                        <TouchableOpacity
                          key={app.id}
                          style={styles.miniCard}
                          onPress={() => router.push('/(app)/(tabs)/applications')}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={styles.miniTitle} numberOfLines={1}>
                              {app.internship_listings?.title ?? 'Internship Position'}
                            </Text>
                            <Text style={styles.miniSub}>
                              {app.internship_listings?.organisation_profiles?.name ?? 'Organisation'}
                              {'  ·  '}{new Date(app.applied_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                            </Text>
                          </View>
                          <View style={[styles.miniBadge, { backgroundColor: statusColor + '20' }]}>
                            <Text style={[styles.miniBadgeText, { color: statusColor }]}>{app.status}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                    <TouchableOpacity style={styles.viewAllBtn} onPress={() => router.push('/(app)/(tabs)/applications')}>
                      <Text style={styles.viewAllBtnText}>View All Applications →</Text>
                    </TouchableOpacity>
                  </View>
                )
              )}

              {/* Saved */}
              {activeTab === 'saved' && (
                savedItems.length === 0 ? (
                  <View style={styles.emptyTab}>
                    <Bookmark size={40} color={C.textMuted} />
                    <Text style={styles.emptyTitle}>No saved jobs</Text>
                    <Text style={styles.emptyText}>Bookmark internships to review them later</Text>
                  </View>
                ) : (
                  <View style={styles.miniList}>
                    {savedItems.map((item) => (
                      <View key={item.id} style={styles.miniCard}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.miniTitle} numberOfLines={1}>
                            {item.internship_listings?.title ?? 'Internship Position'}
                          </Text>
                          <Text style={styles.miniSub}>
                            {item.internship_listings?.organisation_profiles?.name ?? 'Organisation'}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => unsaveListing(item.id)} style={styles.unsaveBtn}>
                          <Trash2 size={16} color={C.error} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )
              )}

              {/* CVs */}
              {activeTab === 'cvs' && (
                !cvProfile ? (
                  <View style={styles.emptyTab}>
                    <FileText size={40} color={C.textMuted} />
                    <Text style={styles.emptyTitle}>No CVs generated yet</Text>
                    <TouchableOpacity style={styles.buildCvBtn} onPress={() => router.push('/(app)/(tabs)/cv-builder')}>
                      <Text style={styles.buildCvBtnText}>Build Your First CV →</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.miniList}>
                    <View style={styles.cvCard}>
                      <LinearGradient colors={[C.primaryBlue, C.accentBlue]} style={styles.cvCardGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                        <FileText size={20} color="#fff" />
                        <Text style={styles.cvCardTitle}>My CV</Text>
                        {cvProfile.target_role ? <Text style={styles.cvCardRole}>{cvProfile.target_role} Intern</Text> : null}
                        {cvProfile.generated_at ? (
                          <Text style={styles.cvCardDate}>
                            Generated {new Date(cvProfile.generated_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </Text>
                        ) : null}
                        <TouchableOpacity style={styles.cvEditBtn} onPress={() => router.push('/(app)/(tabs)/cv-builder')}>
                          <Text style={styles.cvEditBtnText}>Edit CV</Text>
                        </TouchableOpacity>
                      </LinearGradient>
                    </View>
                  </View>
                )
              )}
            </>
          )}
        </View>

        {/* ── Settings ── */}
        <View style={styles.settingsSection}>
          <Text style={styles.settingsTitle}>Settings</Text>
          <View style={styles.settingsCard}>
            {SETTINGS.map((item, i) => {
              const Icon = item.icon;
              return (
                <React.Fragment key={i}>
                  <TouchableOpacity style={styles.settingsItem} onPress={item.onPress}>
                    <View style={styles.settingsIconWrap}>
                      <Icon size={18} color={C.accentBlue} />
                    </View>
                    <Text style={styles.settingsLabel}>{item.label}</Text>
                    <ChevronRight size={18} color={C.textMuted} />
                  </TouchableOpacity>
                  {i < SETTINGS.length - 1 && <View style={styles.settingsDivider} />}
                </React.Fragment>
              );
            })}
          </View>

          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <LogOut size={18} color={C.error} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Modals ── */}
      <EditProfileModal visible={editVisible} onClose={() => setEditVisible(false)} />
      <NotificationsModal visible={notifVisible} onClose={() => setNotifVisible(false)} />
      <PrivacyModal visible={privacyVisible} onClose={() => setPrivacyVisible(false)} />
      <ChangePasswordModal visible={passwordVisible} onClose={() => setPasswordVisible(false)} />
      <HelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} />
      <AboutModal visible={aboutVisible} onClose={() => setAboutVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.background },

  // Header
  headerGradient: { paddingTop: 20, paddingBottom: 32, paddingHorizontal: 20, alignItems: 'center', position: 'relative' },
  editBtn: { position: 'absolute', top: 20, right: 20, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  editBtnText: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#fff' },
  avatarContainer: { marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  avatarText: { fontFamily: 'DMSans_700Bold', fontSize: 32, color: '#fff' },
  profileName: { fontFamily: 'Fraunces_700Bold', fontSize: 24, color: '#fff', marginBottom: 4 },
  profileDept: { ...Typography.body, color: 'rgba(255,255,255,0.8)', marginBottom: 12 },
  profileMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  metaBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  metaBadgeText: { fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: '#fff' },
  metaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.5)' },
  metaText: { ...Typography.label, color: 'rgba(255,255,255,0.8)' },
  profileBio: { ...Typography.body, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 6, maxWidth: 300 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12, justifyContent: 'center' },
  skillChip: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  skillChipText: { fontFamily: 'DMSans_500Medium', fontSize: 11, color: '#fff' },

  // Completion
  completionCard: { marginHorizontal: 20, marginTop: -20, backgroundColor: C.white, borderRadius: Radii.card, padding: 18, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 16 },
  completionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  completionTitle: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: C.textDark },
  completionPct: { fontFamily: 'DMSans_700Bold', fontSize: 16, color: C.accentBlue },
  completionBar: { height: 8, backgroundColor: C.lightBlue, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  completionFill: { height: '100%', backgroundColor: C.accentBlue, borderRadius: 4 },
  completionHint: { ...Typography.micro, color: C.accentBlue },

  // Stats
  statsRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 20, backgroundColor: C.white, borderRadius: Radii.card, borderWidth: 1, borderColor: C.cardBorder, overflow: 'hidden' },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statNumber: { fontFamily: 'DMSans_700Bold', fontSize: 22, color: C.primaryBlue },
  statLabel: { ...Typography.micro, color: C.textMuted, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: C.borderLight, marginVertical: 10 },

  // Tabs
  tabRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 4, borderRadius: Radii.md, backgroundColor: C.surfaceGrey, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 8 },
  tabActive: { backgroundColor: C.white },
  tabText: { ...Typography.labelSemiBold, color: C.textMuted },
  tabTextActive: { color: C.textDark },
  tabContent: { minHeight: 150 },
  tabLoading: { paddingVertical: 40, alignItems: 'center' },

  emptyTab: { alignItems: 'center', paddingVertical: 40, gap: 10, paddingHorizontal: 20 },
  emptyTitle: { fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: C.textDark },
  emptyText: { ...Typography.body, color: C.textMuted, textAlign: 'center' },
  buildCvBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: Radii.button, backgroundColor: C.primaryBlue, marginTop: 4 },
  buildCvBtnText: { ...Typography.button, color: '#fff' },

  // Mini list
  miniList: { paddingHorizontal: 20, paddingTop: 16, gap: 10 },
  miniCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.white, borderRadius: Radii.md, padding: 14, borderWidth: 1, borderColor: C.cardBorder },
  miniTitle: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: C.textDark },
  miniSub: { ...Typography.micro, color: C.textMuted, marginTop: 2 },
  miniBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  miniBadgeText: { fontFamily: 'DMSans_700Bold', fontSize: 11 },
  unsaveBtn: { padding: 8 },
  viewAllBtn: { paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: C.primaryBlue, borderRadius: Radii.md, marginTop: 4 },
  viewAllBtnText: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: C.primaryBlue },

  // CV card
  cvCard: { borderRadius: Radii.card, overflow: 'hidden' },
  cvCardGradient: { padding: 20, gap: 4 },
  cvCardTitle: { fontFamily: 'DMSans_700Bold', fontSize: 16, color: '#fff', marginTop: 6 },
  cvCardRole: { ...Typography.body, color: 'rgba(255,255,255,0.85)' },
  cvCardDate: { ...Typography.micro, color: 'rgba(255,255,255,0.65)', marginBottom: 10 },
  cvEditBtn: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  cvEditBtnText: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#fff' },

  // Settings
  settingsSection: { marginTop: 24, marginHorizontal: 20 },
  settingsTitle: { fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: C.textDark, marginBottom: 12 },
  settingsCard: { backgroundColor: C.white, borderRadius: Radii.card, borderWidth: 1, borderColor: C.cardBorder, overflow: 'hidden' },
  settingsItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 },
  settingsIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.lightBlue, justifyContent: 'center', alignItems: 'center' },
  settingsLabel: { flex: 1, ...Typography.bodyMedium, color: C.textDark },
  settingsDivider: { height: 1, backgroundColor: C.borderLight, marginLeft: 66 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 20, paddingVertical: 15, borderRadius: Radii.card, borderWidth: 1, borderColor: C.error + '30', backgroundColor: C.error + '08' },
  signOutText: { fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: C.error },
});
