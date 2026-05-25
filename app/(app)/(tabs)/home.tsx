import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, FlatList, ActivityIndicator, RefreshControl, Image, Platform,
  Modal, Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Typography, Radii } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import {
  INTERNSHIP_CATEGORIES, formatNairaRange, getGreeting,
} from '@/constants/AppData';
import { Search, SlidersHorizontal, MapPin, Clock, Bookmark, SearchX, Bell, Megaphone, X, CheckCheck, Briefcase } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { evaluateInternshipMatches } from '@/lib/nvidia';
import { computeLocalMatch } from '@/lib/matchScore';

const DISMISSED_KEY = 'il_student_dismissed_announcements';
const READ_KEY = 'il_student_read_announcements';

async function loadSet(key: string): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw)) : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

async function saveSet(key: string, ids: Set<string>) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify([...ids]));
  } catch {}
}

// ---- Types ----
interface Listing {
  id: string;
  title: string;
  description: string;
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  is_siwes: boolean;
  created_at: string;
  required_skills: string[];
  status: string;
  organisation_profiles: {
    name: string;
    logo_url: string | null;
  } | null;
}

interface StudentNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  listing_id: string | null;
  read: boolean;
  created_at: string;
}


const GRADIENTS: [string, string][] = [
  ['#1A3A6B', '#2D6BE4'],
  ['#0D2348', '#1A3A6B'],
  ['#1A4060', '#2D6BE4'],
  ['#0D3060', '#1E5FA0'],
];

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [aiMatchScores, setAiMatchScores] = useState<Record<string, number>>({});
  const [aiStatus, setAiStatus] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle');
  const aiMatchFiredRef = useRef(false);

  // Announcements
  const [announcements, setAnnouncements] = useState<{ id: string; title: string; body: string; created_at: string }[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [showNotifModal, setShowNotifModal] = useState(false);
  const modalAnim = useRef(new Animated.Value(0)).current;

  // Student-specific in-app notifications (new listing alerts)
  const [studentNotifs, setStudentNotifs] = useState<StudentNotification[]>([]);

  // Derived
  const activeBanners = announcements.filter(a => !dismissedIds.has(a.id));
  const dismissedAnnouncements = announcements.filter(a => dismissedIds.has(a.id));
  const unreadAnnouncementCount = dismissedAnnouncements.filter(a => !readIds.has(a.id)).length;
  const unreadStudentNotifCount = studentNotifs.filter(n => !n.read).length;
  const unreadCount = unreadAnnouncementCount + unreadStudentNotifCount;

  // Load persisted sets on mount
  useEffect(() => {
    loadSet(DISMISSED_KEY).then(s => setDismissedIds(s));
    loadSet(READ_KEY).then(s => setReadIds(s));
  }, []);

  const openNotifModal = () => {
    setShowNotifModal(true);
    Animated.spring(modalAnim, { toValue: 1, useNativeDriver: true, friction: 8, tension: 80 }).start();
  };

  const closeNotifModal = () => {
    Animated.timing(modalAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setShowNotifModal(false));
  };

  const dismissAnnouncement = async (id: string) => {
    const next = new Set(dismissedIds).add(id);
    setDismissedIds(next);
    await saveSet(DISMISSED_KEY, next);
  };

  const markAsRead = async (id: string) => {
    const next = new Set(readIds).add(id);
    setReadIds(next);
    await saveSet(READ_KEY, next);
  };

  const markAllAsRead = async () => {
    const next = new Set(readIds);
    dismissedAnnouncements.forEach(a => next.add(a.id));
    setReadIds(next);
    await saveSet(READ_KEY, next);
  };

  // Student notification helpers
  const fetchStudentNotifs = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const { data } = await supabase
        .from('student_notifications')
        .select('id, type, title, body, listing_id, read, created_at')
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(30);
      if (data) setStudentNotifs(data as StudentNotification[]);
    } catch {
      // table may not exist yet — silently ignore
    }
  }, [profile?.id]);

  const markStudentNotifRead = async (id: string) => {
    setStudentNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await supabase.from('student_notifications').update({ read: true }).eq('id', id);
  };

  const markAllStudentNotifsRead = async () => {
    const unreadIds = studentNotifs.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    setStudentNotifs(prev => prev.map(n => ({ ...n, read: true })));
    await supabase.from('student_notifications').update({ read: true }).in('id', unreadIds);
  };

  const firstName = profile?.first_name ?? 'Student';
  const avatarUrl = profile?.avatar_url ?? null;
  const greeting = getGreeting();
  const profileSkills = profile?.skills ?? [];

  const fetchListings = useCallback(async () => {
    const { data, error } = await supabase
      .from('internship_listings')
      .select('*, organisation_profiles(name, logo_url)')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setListings(data as Listing[]);
    }
  }, []);

  // AI match effect — fires once when we have both listings AND profile
  useEffect(() => {
    if (aiMatchFiredRef.current) return;
    if (!profile || listings.length === 0) return;

    aiMatchFiredRef.current = true;

    const profileForLocal = { skills: profile.skills ?? [], department: profile.department ?? '', bio: profile.bio };

    // Score all listings locally right now (instant, no spinner needed)
    const localScores: Record<string, number> = {};
    for (const l of listings) {
      localScores[l.id] = computeLocalMatch(l, profileForLocal);
    }
    setAiMatchScores(localScores);

    // NVIDIA API is blocked by CORS when running in a web browser (localhost).
    // Skip the AI call on web — local scores are already shown above.
    // On Android / iOS devices there is no CORS restriction, so the call proceeds normally.
    if (Platform.OS === 'web') {
      setAiStatus('success');
      return;
    }

    setAiStatus('loading');

    // Sort top 10 by local score to send to AI
    const top10 = [...listings]
      .sort((a, b) => (localScores[b.id] ?? 0) - (localScores[a.id] ?? 0))
      .slice(0, 10);

    evaluateInternshipMatches(
      {
        department: profile.department || '',
        level: profile.level || '',
        skills: profile.skills ?? [],
        bio: profile.bio,
      },
      top10.map((l, idx) => ({
        id: idx.toString(),
        title: l.title,
        description: l.description || '',
        requirements: l.required_skills || [],
      }))
    )
      .then(scores => {
        const mappedScores: Record<string, number> = { ...localScores };
        for (const [key, score] of Object.entries(scores)) {
          const idx = parseInt(key, 10);
          if (!isNaN(idx) && top10[idx]) {
            mappedScores[top10[idx].id] = typeof score === 'number' ? score : parseInt(String(score), 10);
          }
        }
        setAiMatchScores(mappedScores);
        setAiStatus('success');
      })
      .catch(err => {
        console.error('[AI Match] Error:', err);
        setAiStatus('failed');
      });
  }, [profile, listings]);

  const fetchSaved = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('saved_listings')
      .select('listing_id')
      .eq('student_id', profile.id);
    if (data) {
      setSavedIds(new Set(data.map((r: { listing_id: string }) => r.listing_id)));
    }
  }, [profile?.id]);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('announcements')
        .select('id, title, body, created_at')
        .eq('target_students', true)
        .order('created_at', { ascending: false })
        .limit(3);
      if (data) setAnnouncements(data);
    } catch {
      // announcements table may not exist yet — silently ignore
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([fetchListings(), fetchSaved(), fetchAnnouncements()]);
      setIsLoading(false);
    };
    load();

    // Subscribe to announcements realtime changes
    const announcementsChannel = supabase
      .channel('announcements_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        () => { fetchAnnouncements(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(announcementsChannel);
    };
  }, [fetchListings, fetchSaved, fetchAnnouncements]);

  // Fetch student notifications once profile is ready; subscribe to realtime inserts
  useEffect(() => {
    if (!profile?.id) return;
    fetchStudentNotifs();

    const channel = supabase
      .channel('student-notifs-home')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'student_notifications', filter: `student_id=eq.${profile.id}` },
        () => fetchStudentNotifs()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id, fetchStudentNotifs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchListings(), fetchSaved(), fetchAnnouncements(), fetchStudentNotifs()]);
    setRefreshing(false);
  };

  const toggleSave = async (listingId: string) => {
    if (!profile?.id) return;
    const isSaved = savedIds.has(listingId);
    if (isSaved) {
      await supabase
        .from('saved_listings')
        .delete()
        .match({ student_id: profile.id, listing_id: listingId });
      setSavedIds((prev) => { const s = new Set(prev); s.delete(listingId); return s; });
    } else {
      await supabase
        .from('saved_listings')
        .insert({ student_id: profile.id, listing_id: listingId });
      setSavedIds((prev) => new Set(prev).add(listingId));
    }
  };

  // Derived sections — use AI score if available, else smart local score
  const profileForMatch = { skills: profileSkills, department: profile?.department ?? '', bio: profile?.bio };
  const withMatch = listings.map((l) => ({
    ...l,
    match: aiMatchScores[l.id] !== undefined
      ? aiMatchScores[l.id]
      : computeLocalMatch(l, profileForMatch)
  }));
  // Sort by match score for featured and recommended
  const sortedByMatch = [...withMatch].sort((a, b) => b.match - a.match);
  const featured = sortedByMatch.slice(0, 3);
  const recommended = sortedByMatch.slice(0, 6);
  const recent = withMatch.slice(0, 4); // keep chronological order
  const siwes = withMatch.filter((l) => l.is_siwes).slice(0, 3);

  const timeSince = (iso: string) => {
    const hrs = Math.round((Date.now() - new Date(iso).getTime()) / 3600000);
    if (hrs < 24) return `${hrs}hrs ago`;
    const days = Math.floor(hrs / 24);
    return days === 1 ? '1d ago' : `${days}d ago`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primaryBlue} />
          <Text style={styles.loadingText}>Loading opportunities...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >

        {/* ——— TOP BAR ——— */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>{greeting}, {firstName}!</Text>
            <Text style={styles.greetingSub}>Let's find your next opportunity</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {/* Bell / Notifications */}
            <TouchableOpacity style={styles.bellWrap} onPress={openNotifModal}>
              <Bell size={20} color={Colors.light.textDark} />
              {unreadCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            {/* Avatar */}
            <TouchableOpacity
              style={styles.avatarWrap}
              onPress={() => router.push('/(app)/(tabs)/profile')}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} resizeMode="cover" />
              ) : (
                <LinearGradient
                  colors={[Colors.light.accentBlue, Colors.light.primaryBlue]}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>
                    {firstName.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ——— SEARCH BAR ——— */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Search size={16} color={Colors.light.placeholder} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search internships, roles, companies..."
              placeholderTextColor={Colors.light.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => router.push('/(app)/(tabs)/search')}
            />
          </View>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => router.push('/(app)/(tabs)/search')}
          >
            <SlidersHorizontal size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* ——— ADMIN ANNOUNCEMENTS (active banners) ——— */}
        {activeBanners.map((a) => (
          <LinearGradient
            key={a.id}
            colors={['#1A3A6B', '#0D2348']}
            style={styles.announcementBanner}
          >
            <View style={styles.announcementIconWrap}>
              <Megaphone size={16} color="#1aaf6b" />
            </View>
            <View style={styles.announcementContent}>
              <Text style={styles.announcementTitle}>{a.title}</Text>
              <Text style={styles.announcementBody} numberOfLines={3}>{a.body}</Text>
              <Text style={styles.announcementHint}>Tap ✕ to move to notifications</Text>
            </View>
            <TouchableOpacity
              onPress={() => dismissAnnouncement(a.id)}
              style={styles.announcementDismiss}
            >
              <X size={14} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </LinearGradient>
        ))}

        {/* ——— FEATURED BANNER ——— */}
        {featured.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Featured Opportunities</Text>
            <FlatList
              data={featured}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={320 + 14}
              decelerationRate="fast"
              contentContainerStyle={styles.featuredList}
              keyExtractor={(i) => i.id}
              renderItem={({ item, index }) => (
                <LinearGradient colors={GRADIENTS[index % GRADIENTS.length]} style={styles.featuredCard}>
                  <View style={styles.featuredBadge}>
                    <Text style={styles.featuredBadgeText}>{item.match}% Match</Text>
                  </View>
                  <Text style={styles.featuredRole}>{item.title}</Text>
                  <Text style={styles.featuredCompany}>{item.organisation_profiles?.name ?? 'Organisation'}</Text>
                  <View style={styles.featuredFooter}>
                    <Text style={styles.featuredSalary}>
                      {formatNairaRange(item.salary_min ?? 0, item.salary_max ?? 0)}
                    </Text>
                    <TouchableOpacity
                      style={styles.featuredApplyBtn}
                      onPress={() => router.push(`/(app)/apply/${item.id}`)}
                    >
                      <Text style={styles.featuredApplyText}>Apply Now</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              )}
            />
          </>
        )}

        {/* ——— CATEGORY CHIPS ——— */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
        >
          {INTERNSHIP_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, activeCategory === cat && styles.chipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.chipText, activeCategory === cat && styles.chipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ——— RECOMMENDED ——— */}
        {recommended.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.sectionTitle}>Recommended For You</Text>
                {aiStatus === 'loading' && <ActivityIndicator size="small" color={Colors.light.primaryBlue} />}
                {aiStatus === 'failed' && <Text style={{ fontSize: 10, color: 'red' }}>AI Match Failed</Text>}
              </View>
              <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/search')}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.recommendedGrid}>
              {recommended.map((item) => {
                const orgName = item.organisation_profiles?.name ?? 'Organisation';
                const initials = orgName.charAt(0).toUpperCase();
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.recCard}
                    onPress={() => router.push(`/(app)/apply/${item.id}`)}
                  >
                    <View style={styles.recHeader}>
                      <View style={styles.recLogo}>
                        {item.organisation_profiles?.logo_url ? (
                          <Image
                            source={{ uri: item.organisation_profiles.logo_url }}
                            style={styles.recLogoImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <Text style={styles.recLogoText}>{initials}</Text>
                        )}
                      </View>
                      <View style={styles.recTopRight}>
                        <View style={styles.recMatchBadge}>
                          <Text style={styles.recMatchText}>{item.match}%</Text>
                        </View>
                        <TouchableOpacity onPress={() => toggleSave(item.id)}>
                          <Bookmark
                            size={16}
                            color={savedIds.has(item.id) ? Colors.light.primaryBlue : Colors.light.textMuted}
                            fill={savedIds.has(item.id) ? Colors.light.primaryBlue : 'none'}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={styles.recRole} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.recCompany}>{orgName}</Text>
                    <View style={styles.recLocation}>
                      <MapPin size={11} color={Colors.light.textMuted} />
                      <Text style={styles.recLocationText}>{item.location ?? 'Remote'}</Text>
                    </View>
                    <Text style={styles.recSalary}>{formatNairaRange(item.salary_min ?? 0, item.salary_max ?? 0)}</Text>
                    <View style={styles.recMatchBar}>
                      <View style={[styles.recMatchFill, { width: `${item.match}%` }]} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* ——— RECENTLY POSTED ——— */}
        {recent.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recently Posted</Text>
              <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/search')}>
                <Text style={styles.viewAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={recent}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentList}
              keyExtractor={(i) => i.id}
              renderItem={({ item }) => {
                const hrs = Math.round((Date.now() - new Date(item.created_at).getTime()) / 3600000);
                const isNew = hrs < 48;
                return (
                  <TouchableOpacity
                    style={styles.recentCard}
                    onPress={() => router.push(`/(app)/apply/${item.id}`)}
                  >
                    {isNew && (
                      <View style={styles.newBadge}><Text style={styles.newBadgeText}>New</Text></View>
                    )}
                    <Text style={styles.recentRole} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.recentCompany}>{item.organisation_profiles?.name ?? 'Organisation'}</Text>
                    <View style={styles.recentMetaRow}>
                      <MapPin size={10} color={Colors.light.textMuted} />
                      <Text style={styles.recentMeta}>{item.location ?? 'Remote'}</Text>
                      <Text style={styles.recentMeta}> · </Text>
                      <Clock size={10} color={Colors.light.textMuted} />
                      <Text style={styles.recentMeta}>{timeSince(item.created_at)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </>
        )}

        {/* ——— SIWES SECTION ——— */}
        {siwes.length > 0 && (
          <View style={styles.siwesSection}>
            <View style={styles.siwesHeader}>
              <Text style={styles.siwesTitle}>SIWES Opportunities</Text>
              <Text style={styles.siwesSubtitle}>
                Approved industrial training placements for your programme
              </Text>
            </View>
            {siwes.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.siwesCard}
                onPress={() => router.push(`/(app)/apply/${item.id}`)}
              >
                <View style={styles.siwesEligibleBadge}>
                  <Text style={styles.siwesEligibleText}>SIWES Eligible</Text>
                </View>
                <Text style={styles.siwesRole}>{item.title}</Text>
                <Text style={styles.siwesCompany}>{item.organisation_profiles?.name ?? 'Organisation'}</Text>
                <View style={styles.siwesFooter}>
                  <View style={styles.siwesMetaRow}>
                    <MapPin size={10} color="rgba(255,255,255,0.6)" />
                    <Text style={styles.siwesMeta}>{item.location ?? 'Remote'}</Text>
                  </View>
                  <Text style={styles.siwesSalary}>{formatNairaRange(item.salary_min ?? 0, item.salary_max ?? 0)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty state when no listings */}
        {listings.length === 0 && (
          <View style={styles.emptyState}>
            <SearchX size={52} color={Colors.light.textMuted} />
            <Text style={styles.emptyTitle}>No listings yet</Text>
            <Text style={styles.emptyText}>Check back soon — organisations are adding internships.</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ——— NOTIFICATIONS MODAL ——— */}
      <Modal
        visible={showNotifModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeNotifModal}
      >
        <View style={styles.modalContainer}>
          <Animated.View style={[
            styles.modalContent,
            {
              transform: [{
                translateY: modalAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [600, 0]
                })
              }]
            }
          ]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Notifications</Text>
                {unreadCount > 0 && (
                  <Text style={styles.modalSubtitle}>{unreadCount} unread</Text>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {unreadCount > 0 && (
                  <TouchableOpacity style={styles.markAllReadBtn} onPress={() => { markAllAsRead(); markAllStudentNotifsRead(); }}>
                    <CheckCheck size={14} color="#1aaf6b" />
                    <Text style={styles.markAllReadText}>Mark all read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.closeModalBtn} onPress={closeNotifModal}>
                  <X size={20} color={Colors.light.textDark} />
                </TouchableOpacity>
              </View>
            </View>

            {dismissedAnnouncements.length === 0 && studentNotifs.length === 0 ? (
              <View style={styles.notifEmptyContainer}>
                <Bell size={48} color={Colors.light.textMuted} style={{ marginBottom: 12 }} />
                <Text style={styles.notifEmptyTitle}>No notifications yet</Text>
                <Text style={styles.notifEmptyText}>
                  New internship alerts and announcements will appear here.
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.notifScroll} showsVerticalScrollIndicator={false}>

                {/* ── New Listing Alerts ── */}
                {studentNotifs.length > 0 && (
                  <>
                    <View style={styles.notifSectionHeader}>
                      <Text style={styles.notifSectionLabel}>NEW LISTINGS</Text>
                    </View>
                    {studentNotifs.map((n) => {
                      const isRead = n.read;
                      return (
                        <View
                          key={n.id}
                          style={[styles.notifItem, !isRead && styles.notifItemUnread]}
                        >
                          <View style={[styles.notifIconWrap, !isRead && { backgroundColor: 'rgba(59,107,212,0.15)' }]}>
                            <Briefcase size={16} color={isRead ? '#94A3B8' : '#3b6fd4'} />
                          </View>
                          <View style={styles.notifBodyWrap}>
                            <Text style={[styles.notifTitle, !isRead && styles.notifTitleUnread]}>
                              {n.title}
                            </Text>
                            <Text style={styles.notifBody}>{n.body}</Text>
                            <View style={styles.notifFooter}>
                              <Text style={styles.notifTime}>
                                {n.created_at ? new Date(n.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : 'Recently'}
                              </Text>
                              {!isRead && (
                                <TouchableOpacity
                                  style={styles.notifActionBtn}
                                  onPress={() => markStudentNotifRead(n.id)}
                                >
                                  <Text style={styles.notifActionText}>Mark read</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </>
                )}

                {/* ── Admin Announcements ── */}
                {dismissedAnnouncements.length > 0 && (
                  <>
                    {studentNotifs.length > 0 && (
                      <View style={styles.notifSectionHeader}>
                        <Text style={styles.notifSectionLabel}>ANNOUNCEMENTS</Text>
                      </View>
                    )}
                    {dismissedAnnouncements.map((a) => {
                      const isRead = readIds.has(a.id);
                      return (
                        <View
                          key={a.id}
                          style={[styles.notifItem, !isRead && styles.notifItemUnread]}
                        >
                          <View style={[styles.notifIconWrap, !isRead && styles.notifIconWrapUnread]}>
                            <Megaphone size={16} color={isRead ? '#94A3B8' : '#1aaf6b'} />
                          </View>
                          <View style={styles.notifBodyWrap}>
                            <Text style={[styles.notifTitle, !isRead && styles.notifTitleUnread]}>
                              {a.title}
                            </Text>
                            <Text style={styles.notifBody}>{a.body}</Text>
                            <View style={styles.notifFooter}>
                              <Text style={styles.notifTime}>
                                {a.created_at ? new Date(a.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : 'Recently'}
                              </Text>
                              {!isRead && (
                                <TouchableOpacity
                                  style={styles.notifActionBtn}
                                  onPress={() => markAsRead(a.id)}
                                >
                                  <Text style={styles.notifActionText}>Mark read</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </>
                )}

                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  scroll: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { ...Typography.body, color: Colors.light.textMuted },

  // Top Bar
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  greeting: { fontFamily: 'DMSans_700Bold', fontSize: 18, color: Colors.light.textDark },
  greetingSub: { ...Typography.body, color: Colors.light.textMuted, marginTop: 2 },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontFamily: 'DMSans_700Bold', fontSize: 18, color: '#FFFFFF' },
  notifBadge: {
    position: 'absolute', top: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: Colors.light.error, borderWidth: 2, borderColor: '#FFFFFF',
  },

  // Search
  searchRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 24 },
  searchInputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.light.inputBg, borderWidth: 1.5,
    borderColor: Colors.light.inputBorder, borderRadius: Radii.lg,
    paddingHorizontal: 14, height: 50,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, ...Typography.body, color: Colors.light.textDark },
  filterBtn: {
    width: 50, height: 50, backgroundColor: Colors.light.primaryBlue,
    borderRadius: Radii.lg, justifyContent: 'center', alignItems: 'center',
  },

  // Announcement banners
  announcementBanner: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, marginHorizontal: 20, marginBottom: 16,
    padding: 16, gap: 14,
    borderWidth: 1, borderColor: 'rgba(26,175,107,0.3)',
  },
  announcementIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(26,175,107,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  announcementContent: { flex: 1 },
  announcementTitle: {
    fontFamily: 'DMSans_700Bold', fontSize: 13,
    color: '#FFFFFF', marginBottom: 2,
  },
  announcementBody: {
    fontFamily: 'DMSans_400Regular', fontSize: 12,
    color: 'rgba(255,255,255,0.7)', lineHeight: 18,
  },
  announcementHint: {
    fontFamily: 'DMSans_400Regular', fontSize: 10,
    color: 'rgba(255,255,255,0.4)', marginTop: 4,
  },
  announcementDismiss: {
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
  },
  announcementDismissText: {
    fontSize: 14, color: '#A16207', fontWeight: '700',
  },

  // Bell Badge Styles
  bellWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.light.inputBg,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
    borderWidth: 1.5, borderColor: Colors.light.inputBorder,
  },
  bellBadge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: Colors.light.error,
    borderRadius: 8, minWidth: 16, height: 16,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5, borderColor: '#FFFFFF',
  },
  bellBadgeText: {
    fontFamily: 'DMSans_700Bold', fontSize: 9, color: '#FFFFFF',
  },

  // Notifications Modal Styles
  modalContainer: {
    flex: 1, backgroundColor: 'rgba(13,27,62,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '80%', backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 24,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontFamily: 'DMSans_700Bold', fontSize: 20, color: Colors.light.textDark,
  },
  modalSubtitle: {
    fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.light.textMuted,
    marginTop: 2,
  },
  markAllReadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(26,175,107,0.1)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8,
  },
  markAllReadText: {
    fontFamily: 'DMSans_700Bold', fontSize: 12, color: '#1aaf6b',
  },
  closeModalBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center',
  },
  notifScroll: {
    flex: 1, paddingHorizontal: 24, paddingTop: 16,
  },
  notifItem: {
    flexDirection: 'row', gap: 14, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
    borderRadius: 12, paddingHorizontal: 10, marginBottom: 4,
  },
  notifItemUnread: {
    backgroundColor: 'rgba(26,175,107,0.03)',
  },
  notifIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center',
  },
  notifIconWrapUnread: {
    backgroundColor: 'rgba(26,175,107,0.12)',
  },
  notifBodyWrap: {
    flex: 1,
  },
  notifTitle: {
    fontFamily: 'DMSans_400Regular', fontSize: 14, color: '#64748B',
    marginBottom: 4,
  },
  notifTitleUnread: {
    fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.light.textDark,
  },
  notifBody: {
    fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#64748B',
    lineHeight: 18, marginBottom: 8,
  },
  notifFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  notifTime: {
    fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#94A3B8',
  },
  notifActionBtn: {
    borderWidth: 1, borderColor: '#CBD5E1',
    borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4,
  },
  notifActionText: {
    fontFamily: 'DMSans_600SemiBold', fontSize: 11, color: '#475569',
  },
  notifEmptyContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 40, paddingBottom: 60,
  },
  notifEmptyTitle: {
    fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: Colors.light.textDark,
    marginBottom: 6,
  },
  notifEmptyText: {
    fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.light.textMuted,
    textAlign: 'center', lineHeight: 18,
  },
  notifSectionHeader: {
    paddingHorizontal: 10, paddingVertical: 8, marginTop: 8,
  },
  notifSectionLabel: {
    fontFamily: 'DMSans_700Bold', fontSize: 10, color: Colors.light.textMuted,
    letterSpacing: 1.2,
  },

  // Sections
  sectionTitle: {
    fontFamily: 'DMSans_600SemiBold', fontSize: 17, color: Colors.light.textDark,
    paddingHorizontal: 20, marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, marginBottom: 14,
  },
  viewAll: { ...Typography.bodySemiBold, color: Colors.light.accentBlue },

  // Featured
  featuredList: { paddingHorizontal: 20, gap: 14 },
  featuredCard: {
    width: 320, borderRadius: 20, padding: 22, marginBottom: 24,
  },
  featuredBadge: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 16,
  },
  featuredBadgeText: { ...Typography.labelSemiBold, color: '#FFFFFF' },
  featuredRole: {
    fontFamily: 'DMSans_700Bold', fontSize: 18, color: '#FFFFFF', marginBottom: 6,
  },
  featuredCompany: { ...Typography.body, color: 'rgba(255,255,255,0.75)', marginBottom: 24 },
  featuredFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  featuredSalary: { ...Typography.bodyMedium, color: 'rgba(255,255,255,0.9)' },
  featuredApplyBtn: {
    backgroundColor: '#FFFFFF', borderRadius: 20,
    paddingHorizontal: 18, paddingVertical: 8,
  },
  featuredApplyText: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.light.primaryBlue },

  // Category Chips
  chipsContainer: { paddingHorizontal: 20, gap: 8, marginBottom: 28 },
  chip: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 50,
    borderWidth: 1.5, borderColor: Colors.light.primaryBlue,
    backgroundColor: Colors.light.white,
  },
  chipActive: { backgroundColor: Colors.light.primaryBlue },
  chipText: { ...Typography.labelSemiBold, color: Colors.light.primaryBlue },
  chipTextActive: { color: '#FFFFFF' },

  // Recommended Grid
  recommendedGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    paddingHorizontal: 20, marginBottom: 32,
  },
  recCard: {
    width: '47%', backgroundColor: Colors.light.white,
    borderRadius: Radii.card, padding: 14,
    borderWidth: 1, borderColor: Colors.light.cardBorder,
  },
  recHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  recLogo: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.light.lightBlue, justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  recLogoImage: { width: 38, height: 38, borderRadius: 12 },
  recLogoText: { fontFamily: 'DMSans_700Bold', fontSize: 16, color: Colors.light.primaryBlue },
  recTopRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recMatchBadge: {
    backgroundColor: Colors.light.lightBlue, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  recMatchText: { fontFamily: 'DMSans_700Bold', fontSize: 11, color: Colors.light.accentBlue },
  recRole: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.light.textDark, marginBottom: 3 },
  recCompany: { ...Typography.label, color: Colors.light.textMuted, marginBottom: 8 },
  recLocation: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  recLocationText: { ...Typography.micro, color: Colors.light.textMuted },
  recSalary: { fontFamily: 'DMSans_600SemiBold', fontSize: 11, color: Colors.light.primaryBlue, marginBottom: 8 },
  recMatchBar: {
    height: 3, backgroundColor: Colors.light.lightBlue,
    borderRadius: 2, overflow: 'hidden',
  },
  recMatchFill: { height: '100%', backgroundColor: Colors.light.accentBlue, borderRadius: 2 },

  // Recent
  recentList: { paddingHorizontal: 20, gap: 12, marginBottom: 32 },
  recentCard: {
    width: 200, backgroundColor: Colors.light.white, borderRadius: Radii.card,
    padding: 16, borderWidth: 1, borderColor: Colors.light.cardBorder,
    position: 'relative',
  },
  newBadge: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: Colors.light.success, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  newBadgeText: { fontFamily: 'DMSans_700Bold', fontSize: 10, color: '#FFFFFF' },
  recentRole: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.light.textDark, marginBottom: 4, marginRight: 40 },
  recentCompany: { ...Typography.label, color: Colors.light.textMuted, marginBottom: 10 },
  recentMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recentMeta: { ...Typography.micro, color: Colors.light.textMuted },

  // SIWES
  siwesSection: {
    marginHorizontal: 20, borderRadius: 20, overflow: 'hidden', marginBottom: 16,
    backgroundColor: Colors.light.primaryBlue, padding: 20,
  },
  siwesHeader: { marginBottom: 18 },
  siwesTitle: { fontFamily: 'DMSans_700Bold', fontSize: 17, color: '#FFFFFF', marginBottom: 4 },
  siwesSubtitle: { ...Typography.body, color: 'rgba(255,255,255,0.7)' },
  siwesCard: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14,
    padding: 16, marginBottom: 10,
  },
  siwesEligibleBadge: {
    alignSelf: 'flex-start', backgroundColor: Colors.light.success,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8,
  },
  siwesEligibleText: { fontFamily: 'DMSans_700Bold', fontSize: 10, color: '#FFFFFF' },
  siwesRole: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: '#FFFFFF', marginBottom: 3 },
  siwesCompany: { ...Typography.label, color: 'rgba(255,255,255,0.75)', marginBottom: 10 },
  siwesFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  siwesMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  siwesMeta: { ...Typography.micro, color: 'rgba(255,255,255,0.6)' },
  siwesSalary: { fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.9)' },

  // Empty
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40, gap: 10 },
  emptyTitle: { fontFamily: 'DMSans_600SemiBold', fontSize: 18, color: Colors.light.textDark },
  emptyText: { ...Typography.body, color: Colors.light.textMuted, textAlign: 'center' },
});
