import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  Image, ImageBackground, Modal, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Pencil, Bell, Lock, Key, HelpCircle, Info, LogOut,
  ChevronRight, FileText, Bookmark, List, Trash2,
  BookOpen, Briefcase, Award, Code2, Target, X,
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Typography, Radii } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
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
  generated_at: string | null;
  cv_data: any | null;
}

const STATUS_COLORS: Record<string, string> = {
  Pending: C.warning,
  Reviewed: C.accentBlue,
  Accepted: C.success,
  Rejected: C.error,
};

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, signOut, fetchProfile } = useAuthStore();
  const showConfirm = useToastStore((state) => state.showConfirm);

  const [activeTab, setActiveTab] = useState<'applications' | 'saved' | 'cvs'>('applications');
  const [recentApps, setRecentApps] = useState<MiniApplication[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [cvProfile, setCvProfile] = useState<CvProfile | null>(null);
  const [isLoadingTab, setIsLoadingTab] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cvModalVisible, setCvModalVisible] = useState(false);

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

  const fetchTabData = useCallback(async (showLoading = true) => {
    if (!profile?.id) return;
    if (showLoading) setIsLoadingTab(true);
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
        .from('generated_cvs')
        .select('id, target_role, generated_at, cv_data')
        .eq('student_id', profile.id)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    if (appsRes.data) setRecentApps(appsRes.data as unknown as MiniApplication[]);
    if (savedRes.data) setSavedItems(savedRes.data as unknown as SavedItem[]);
    if (cvRes.data) setCvProfile(cvRes.data as unknown as CvProfile);
    if (showLoading) setIsLoadingTab(false);
  }, [profile?.id]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchProfile(),
      fetchTabData(false),
    ]);
    setIsRefreshing(false);
  };

  useEffect(() => { fetchTabData(); }, [fetchTabData]);

  const handleSignOut = () => {
    showConfirm({
      title: 'Sign Out',
      description: 'Are you sure you want to sign out of your account?',
      confirmLabel: 'Sign Out',
      cancelLabel: 'Cancel',
      onConfirm: async () => {
        await signOut();
        router.replace('/(auth)/sign-in');
      },
    });
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
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >

        {/* ── Header ── */}
        <ImageBackground
          source={profile?.cover_url ? { uri: profile.cover_url } : undefined}
          style={styles.headerGradient}
          imageStyle={{ resizeMode: 'cover' }}
        >
          {/* Blue gradient tint always on top — acts as filter over cover photo */}
          <LinearGradient
            colors={[
              profile?.cover_url ? 'rgba(26,86,219,0.80)' : C.primaryBlue,
              profile?.cover_url ? 'rgba(59,130,246,0.85)' : C.accentBlue,
            ]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />

          <TouchableOpacity style={styles.editBtn} onPress={() => setEditVisible(true)}>
            <Pencil size={13} color="#fff" />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>

          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
              )}
            </View>
          </View>

          <Text style={styles.profileName}>{firstName} {lastName}</Text>
          <Text style={styles.profileDept}>{department}</Text>
        </ImageBackground>

        {/* ── About Card ── */}
        <View style={styles.aboutCard}>
          {/* Level & Matric row */}
          <View style={styles.aboutRow}>
            <View style={styles.aboutItem}>
              <Text style={styles.aboutItemLabel}>Level</Text>
              <Text style={styles.aboutItemValue}>{level}</Text>
            </View>
            <View style={styles.aboutDividerV} />
            <View style={styles.aboutItem}>
              <Text style={styles.aboutItemLabel}>Matric No.</Text>
              <Text style={styles.aboutItemValue} numberOfLines={1}>{matric}</Text>
            </View>
          </View>

          {/* Bio */}
          {bio ? (
            <>
              <View style={styles.aboutSeparator} />
              <View style={styles.aboutBioSection}>
                <Text style={styles.aboutSectionLabel}>About</Text>
                <Text style={styles.aboutBioText}>{bio}</Text>
              </View>
            </>
          ) : null}

          {/* Skills */}
          {skills.length > 0 && (
            <>
              <View style={styles.aboutSeparator} />
              <View style={styles.aboutBioSection}>
                <Text style={styles.aboutSectionLabel}>Skills</Text>
                <View style={styles.skillsRow}>
                  {skills.map((sk) => (
                    <View key={sk} style={styles.skillChip}>
                      <Text style={styles.skillChipText}>{sk}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}
        </View>

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
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                          <TouchableOpacity style={styles.cvEditBtn} onPress={() => setCvModalVisible(true)}>
                            <Text style={styles.cvEditBtnText}>View CV</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.cvEditBtn, { backgroundColor: 'rgba(255,255,255,0.1)' }]} onPress={() => router.push('/(app)/(tabs)/cv-builder')}>
                            <Text style={styles.cvEditBtnText}>Edit / Redo</Text>
                          </TouchableOpacity>
                        </View>
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

      {/* ── CV Preview Modal ── */}
      {cvProfile?.cv_data && (
        <Modal visible={cvModalVisible} animationType="slide" onRequestClose={() => setCvModalVisible(false)}>
          <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
            <View style={styles.cvModalHeader}>
              <Text style={styles.cvModalTitle}>My CV</Text>
              <TouchableOpacity style={styles.cvModalClose} onPress={() => setCvModalVisible(false)}>
                <X size={18} color={C.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
              {/* Header */}
              <LinearGradient colors={[C.primaryBlue, C.accentBlue]} style={styles.cvDocHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.cvName}>{profile?.first_name} {profile?.last_name}</Text>
                <Text style={styles.cvRole}>{cvProfile.cv_data.targetRole} Intern</Text>
                <Text style={styles.cvContact}>{profile?.email}{profile?.phone ? `  ·  ${profile.phone}` : ''}</Text>
              </LinearGradient>

              {/* Summary */}
              <CVPreviewSection title="Professional Summary" icon={<FileText size={14} color={C.accentBlue} />}>
                <Text style={styles.cvBody}>{cvProfile.cv_data.summary}</Text>
              </CVPreviewSection>

              {/* Education */}
              <CVPreviewSection title="Education" icon={<BookOpen size={14} color={C.accentBlue} />}>
                {cvProfile.cv_data.education?.map((edu: any, i: number) => (
                  <View key={i} style={styles.cvEntry}>
                    <View style={styles.cvEntryRow}>
                      <Text style={styles.cvEntryTitle}>{edu.institution}</Text>
                      <Text style={styles.cvEntryDate}>{edu.period}</Text>
                    </View>
                    <Text style={styles.cvEntrySub}>{edu.degree}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}</Text>
                  </View>
                ))}
              </CVPreviewSection>

              {/* Skills */}
              <CVPreviewSection title="Skills" icon={<Award size={14} color={C.accentBlue} />}>
                {cvProfile.cv_data.skills?.map((g: any, i: number) => (
                  <Text key={i} style={styles.cvBody}><Text style={{ fontFamily: 'DMSans_600SemiBold' }}>{g.category}: </Text>{g.items?.join(', ')}</Text>
                ))}
              </CVPreviewSection>

              {/* Projects */}
              {cvProfile.cv_data.projects?.length > 0 && (
                <CVPreviewSection title="Projects" icon={<Code2 size={14} color={C.accentBlue} />}>
                  {cvProfile.cv_data.projects.map((p: any, i: number) => (
                    <View key={i} style={styles.cvEntry}>
                      <Text style={styles.cvEntryTitle}>{p.title}</Text>
                      <Text style={styles.cvBody}>{p.description}</Text>
                      <View style={styles.techRow}>
                        {(Array.isArray(p.technologies) ? p.technologies : []).map((t: string) => (
                          <View key={t} style={styles.techChip}><Text style={styles.techChipText}>{t}</Text></View>
                        ))}
                      </View>
                    </View>
                  ))}
                </CVPreviewSection>
              )}

              {/* Experience */}
              {cvProfile.cv_data.experience?.length > 0 && (
                <CVPreviewSection title="Work Experience" icon={<Briefcase size={14} color={C.accentBlue} />}>
                  {cvProfile.cv_data.experience.map((e: any, i: number) => (
                    <View key={i} style={styles.cvEntry}>
                      <View style={styles.cvEntryRow}>
                        <Text style={styles.cvEntryTitle}>{e.role} — {e.company}</Text>
                        <Text style={styles.cvEntryDate}>{e.period}</Text>
                      </View>
                      {e.description ? <Text style={styles.cvBody}>{e.description}</Text> : null}
                    </View>
                  ))}
                </CVPreviewSection>
              )}

              {/* Hobbies */}
              {cvProfile.cv_data.hobbies?.length > 0 && (
                <CVPreviewSection title="Hobbies & Interests" icon={<Target size={14} color={C.accentBlue} />}>
                  <Text style={styles.cvBody}>{cvProfile.cv_data.hobbies.join('  ·  ')}</Text>
                </CVPreviewSection>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

// ── CV Preview Section helper ──────────────────────────────────
function CVPreviewSection({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={styles.cvSection}>
      <View style={styles.cvSectionHeader}>
        <View style={styles.cvSectionBar} />
        {icon && <View style={styles.cvSectionIcon}>{icon}</View>}
        <Text style={styles.cvSectionTitle}>{title}</Text>
      </View>
      <View style={{ gap: 8 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.background },

  // Header
  headerGradient: { paddingTop: 20, paddingBottom: 48, paddingHorizontal: 20, alignItems: 'center', position: 'relative', overflow: 'hidden' },
  editBtn: { position: 'absolute', top: 20, right: 20, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, zIndex: 2 },
  editBtnText: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#fff' },
  avatarContainer: { marginBottom: 14, zIndex: 1 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  avatarText: { fontFamily: 'DMSans_700Bold', fontSize: 36, color: '#fff' },
  profileName: { fontFamily: 'DMSans_700Bold', fontSize: 24, color: '#fff', marginBottom: 6, textAlign: 'center', zIndex: 1 },
  profileDept: { ...Typography.body, color: 'rgba(255,255,255,0.8)', textAlign: 'center', zIndex: 1 },

  // About card (floats over header bottom)
  aboutCard: {
    marginHorizontal: 20, marginTop: -26,
    backgroundColor: C.white, borderRadius: Radii.card,
    borderWidth: 1, borderColor: C.cardBorder,
    overflow: 'hidden', marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  aboutRow: { flexDirection: 'row', alignItems: 'center' },
  aboutItem: { flex: 1, alignItems: 'center', paddingVertical: 18 },
  aboutItemLabel: { fontFamily: 'DMSans_500Medium', fontSize: 11, color: C.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  aboutItemValue: { fontFamily: 'DMSans_700Bold', fontSize: 15, color: C.textDark },
  aboutDividerV: { width: 1, height: 40, backgroundColor: C.borderLight },
  aboutSeparator: { height: 1, backgroundColor: C.borderLight, marginHorizontal: 16 },
  aboutBioSection: { paddingHorizontal: 18, paddingVertical: 16, gap: 8 },
  aboutSectionLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  aboutBioText: { ...Typography.body, color: C.textDark, lineHeight: 22 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: { backgroundColor: C.lightBlue, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  skillChipText: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: C.primaryBlue },

  // Completion
  completionCard: { marginHorizontal: 20, marginTop: 0, backgroundColor: C.white, borderRadius: Radii.card, padding: 18, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 16 },
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

  // CV Preview Modal
  cvModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 28, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.borderLight, backgroundColor: C.white },
  cvModalTitle: { fontFamily: 'DMSans_700Bold', fontSize: 18, color: C.textDark },
  cvModalClose: { padding: 8, borderRadius: 20, backgroundColor: C.surfaceGrey },
  cvModalCloseText: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: C.textMuted },
  cvDocHeader: { padding: 20, borderRadius: 12, marginBottom: 16 },
  cvName: { fontFamily: 'DMSans_700Bold', fontSize: 20, color: '#fff' },
  cvRole: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  cvContact: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  cvSection: { backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.cardBorder, padding: 14, marginBottom: 12 },
  cvSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cvSectionBar: { width: 3, height: 16, borderRadius: 2, backgroundColor: C.accentBlue },
  cvSectionIcon: { width: 22, height: 22, borderRadius: 6, backgroundColor: C.lightBlue, justifyContent: 'center', alignItems: 'center' },
  cvSectionTitle: { fontFamily: 'DMSans_700Bold', fontSize: 12, color: C.primaryBlue, textTransform: 'uppercase', letterSpacing: 0.5 },
  cvEntry: { gap: 4, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  cvEntryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cvEntryTitle: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: C.textDark, flex: 1 },
  cvEntryDate: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: C.textMuted },
  cvEntrySub: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: C.textMuted },
  cvBody: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: C.textDark, lineHeight: 20 },
  techRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  techChip: { backgroundColor: C.lightBlue, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  techChipText: { fontFamily: 'DMSans_500Medium', fontSize: 10, color: C.primaryBlue },
});
