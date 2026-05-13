import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, FlatList, ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Typography, Radii } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import {
  INTERNSHIP_CATEGORIES, formatNairaRange, getGreeting,
} from '@/constants/AppData';
import { Search, SlidersHorizontal, MapPin, Clock, Bookmark, SearchX } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { evaluateInternshipMatches } from '@/lib/nvidia';

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

// ── Semantic skill synonym map ──────────────────────────────────────────────
// Maps common skill variants to a canonical group, so "ReactJS" matches "React"
const SKILL_SYNONYMS: Record<string, string[]> = {
  javascript: ['js', 'es6', 'es2015', 'node', 'nodejs', 'typescript', 'ts'],
  react:      ['reactjs', 'react.js', 'react native', 'nextjs', 'next.js'],
  python:     ['django', 'flask', 'fastapi', 'pandas', 'numpy', 'pytorch', 'tensorflow'],
  design:     ['ui', 'ux', 'ui/ux', 'figma', 'adobe xd', 'sketch', 'canva', 'illustrator'],
  frontend:   ['html', 'css', 'sass', 'tailwind', 'bootstrap', 'vue', 'angular', 'svelte'],
  backend:    ['api', 'rest', 'graphql', 'sql', 'database', 'postgres', 'mysql', 'mongodb'],
  mobile:     ['android', 'ios', 'flutter', 'swift', 'kotlin', 'expo'],
  data:       ['excel', 'power bi', 'tableau', 'analytics', 'machine learning', 'ml', 'ai'],
  marketing:  ['seo', 'sem', 'social media', 'content', 'copywriting', 'ads', 'campaigns'],
  finance:    ['accounting', 'bookkeeping', 'financial analysis', 'excel', 'quickbooks'],
};

// Checks if two skill strings are semantically equivalent
function skillsMatch(a: string, b: string): boolean {
  if (a.includes(b) || b.includes(a)) return true;
  for (const [, synonyms] of Object.entries(SKILL_SYNONYMS)) {
    if (synonyms.some(s => a.includes(s)) && synonyms.some(s => b.includes(s))) return true;
  }
  return false;
}

// Department-to-role keyword map
const DEPT_ROLE_MAP: Record<string, string[]> = {
  'computer science':       ['software', 'developer', 'engineer', 'frontend', 'backend', 'fullstack', 'data', 'mobile', 'web', 'tech'],
  'information technology': ['it', 'support', 'network', 'systems', 'cloud', 'security', 'devops', 'tech'],
  'electrical engineering': ['hardware', 'embedded', 'electronics', 'iot', 'circuit', 'automation', 'control'],
  'mechanical engineering': ['cad', 'manufacturing', 'production', 'design', 'maintenance', 'fabrication'],
  'business administration':['management', 'operations', 'strategy', 'admin', 'business', 'project'],
  'accounting':             ['finance', 'audit', 'tax', 'accounting', 'bookkeeping', 'financial'],
  'economics':              ['research', 'analysis', 'finance', 'policy', 'data', 'economics'],
  'mass communication':     ['media', 'journalism', 'content', 'pr', 'marketing', 'communications', 'social media'],
  'marketing':              ['marketing', 'brand', 'sales', 'digital', 'content', 'advertising', 'campaigns'],
  'law':                    ['legal', 'compliance', 'contract', 'corporate', 'counsel', 'paralegal'],
  'medicine':               ['health', 'medical', 'clinical', 'research', 'pharma', 'biotech'],
};

/**
 * Multi-factor weighted local match score (runs instantly, no network).
 * Scoring breakdown (max 99):
 *   Skills match (direct + semantic)  → up to 40 pts
 *   Department ↔ role alignment       → up to 25 pts
 *   Bio / description keyword match   → up to 15 pts
 *   Skills mentioned in job text      → up to 10 pts
 *   Base score (everyone gets this)   →      9 pts
 */
function computeLocalMatch(
  listing: Listing,
  profile: { skills: string[]; department: string; bio?: string }
): number {
  const titleLower = (listing.title || '').toLowerCase();
  const deptLower  = (profile.department || '').toLowerCase();
  const pSkills    = (profile.skills || []).map(s => s.toLowerCase());
  const rSkills    = (listing.required_skills || []).map(s => s.toLowerCase());
  const descLower  = (listing.description || '').toLowerCase();
  const bioLower   = (profile.bio || '').toLowerCase();
  const allJobText = `${titleLower} ${descLower}`;

  let score = 9; // base — everyone gets this

  // ── 1. Skills match (up to 40 pts) ──────────────────────────────────────
  if (rSkills.length > 0 && pSkills.length > 0) {
    const matched = rSkills.filter(r => pSkills.some(p => skillsMatch(p, r))).length;
    score += Math.round((matched / rSkills.length) * 40);
  } else if (pSkills.length > 0) {
    // No required_skills set — check profile skills against job text
    const matched = pSkills.filter(s => allJobText.includes(s)).length;
    score += Math.min(20, matched * 7);
  }

  // ── 2. Department ↔ role alignment (up to 25 pts) ───────────────────────
  let deptScore = 0;
  // Exact department word in title/desc
  const deptWords = deptLower.split(/[\s/]+/).filter(w => w.length > 3);
  for (const w of deptWords) {
    if (allJobText.includes(w)) deptScore = Math.max(deptScore, 15);
  }
  // Semantic department → role mapping
  for (const [deptKey, roleKeywords] of Object.entries(DEPT_ROLE_MAP)) {
    if (deptLower.includes(deptKey)) {
      const overlap = roleKeywords.filter(kw => allJobText.includes(kw)).length;
      deptScore = Math.max(deptScore, Math.min(25, overlap * 8));
    }
  }
  score += deptScore;

  // ── 3. Bio keyword match (up to 15 pts) ─────────────────────────────────
  if (bioLower.length > 10) {
    const bioWords = bioLower.split(/\s+/).filter(w => w.length > 4);
    const bioMatches = bioWords.filter(w => allJobText.includes(w)).length;
    score += Math.min(15, bioMatches * 3);
  }

  // ── 4. Profile skills appear in job text (up to 10 pts) ─────────────────
  const skillsInText = pSkills.filter(s => allJobText.includes(s)).length;
  score += Math.min(10, skillsInText * 4);

  return Math.min(99, Math.max(9, score));
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
  const aiMatchFiredRef = useRef(false); // prevent double-fire

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
    setAiStatus('loading');

    const profileForLocal = { skills: profile.skills ?? [], department: profile.department ?? '', bio: profile.bio };

    // Score all listings locally right now (instant, no spinner needed)
    const localScores: Record<string, number> = {};
    for (const l of listings) {
      localScores[l.id] = computeLocalMatch(l, profileForLocal);
    }
    setAiMatchScores(localScores);

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

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([fetchListings(), fetchSaved()]);
      setIsLoading(false);
    };
    load();
  }, [fetchListings, fetchSaved]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchListings(), fetchSaved()]);
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
  const featured = withMatch.slice(0, 3);
  const recommended = [...withMatch].sort((a, b) => b.match - a.match).slice(0, 6);
  const recent = withMatch.slice(0, 4);
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
            <View style={styles.notifBadge} />
          </TouchableOpacity>
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
