import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, Radii } from '@/constants/theme';
import { formatNairaRange, NIGERIAN_LOCATIONS } from '@/constants/AppData';
import { Search, SlidersHorizontal, MapPin, Clock, Bookmark, SearchX } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

interface Listing {
  id: string;
  title: string;
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  is_siwes: boolean;
  created_at: string;
  required_skills: string[];
  status: string;
  duration: string | null;
  organisation_profiles: { name: string; logo_url: string | null } | null;
}

function computeMatch(listing: Listing, profileSkills: string[]): number {
  if (!listing.required_skills?.length || !profileSkills?.length) return 70;
  const required = listing.required_skills.map((s) => s.toLowerCase());
  const has = profileSkills.map((s) => s.toLowerCase());
  const overlap = required.filter((r) => has.includes(r)).length;
  return Math.min(99, Math.round(70 + (overlap / required.length) * 29));
}

export default function SearchScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const profileSkills = profile?.skills ?? [];

  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('match');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [siwesOnly, setSiwesOnly] = useState(false);

  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const fetchListings = useCallback(async () => {
    const { data } = await supabase
      .from('internship_listings')
      .select('*, organisation_profiles(name, logo_url)')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false });
    if (data) setAllListings(data as Listing[]);
  }, []);

  const fetchSaved = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('saved_listings')
      .select('listing_id')
      .eq('student_id', profile.id);
    if (data) setSavedIds(new Set(data.map((r: { listing_id: string }) => r.listing_id)));
  }, [profile?.id]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchListings(), fetchSaved()]);
    setIsRefreshing(false);
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([fetchListings(), fetchSaved()]);
      setIsLoading(false);
    };
    load();

    const channel = supabase
      .channel('public-listings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'internship_listings' },
        () => fetchListings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchListings, fetchSaved]);

  const toggleSave = async (listingId: string) => {
    if (!profile?.id) return;
    const isSaved = savedIds.has(listingId);
    if (isSaved) {
      await supabase.from('saved_listings').delete().match({ student_id: profile.id, listing_id: listingId });
      setSavedIds((prev) => { const s = new Set(prev); s.delete(listingId); return s; });
    } else {
      await supabase.from('saved_listings').insert({ student_id: profile.id, listing_id: listingId });
      setSavedIds((prev) => new Set(prev).add(listingId));
    }
  };

  const withMatch = allListings.map((l) => ({ ...l, match: computeMatch(l, profileSkills) }));

  const filtered = withMatch
    .filter((item) => {
      const matchesQuery =
        !query ||
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        (item.organisation_profiles?.name ?? '').toLowerCase().includes(query.toLowerCase());
      const matchesLocation =
        selectedLocations.length === 0 || selectedLocations.includes(item.location ?? '');
      const matchesSiwes = !siwesOnly || item.is_siwes;
      return matchesQuery && matchesLocation && matchesSiwes;
    })
    .sort((a, b) => {
      if (sortBy === 'match') return b.match - a.match;
      if (sortBy === 'salary') return (b.salary_max ?? 0) - (a.salary_max ?? 0);
      if (sortBy === 'date') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return 0;
    });

  const toggleLocation = (loc: string) => {
    setSelectedLocations((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
    );
  };

  const timeSince = (iso: string) => {
    const hrs = Math.round((Date.now() - new Date(iso).getTime()) / 3600000);
    if (hrs < 24) return `${hrs}hrs ago`;
    const days = Math.floor(hrs / 24);
    return days === 1 ? '1d ago' : `${days}d ago`;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Search Bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Internships</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <Search size={16} color={Colors.light.placeholder} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search roles, companies..."
              placeholderTextColor={Colors.light.placeholder}
              value={query}
              onChangeText={setQuery}
            />
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilter(!showFilter)}>
            <SlidersHorizontal size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Sort Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortRow}>
          {[
            { key: 'match', label: 'Best Match' },
            { key: 'date', label: 'Date Posted' },
            { key: 'salary', label: 'Highest Salary' },
          ].map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[styles.sortChip, sortBy === s.key && styles.sortChipActive]}
              onPress={() => setSortBy(s.key)}
            >
              <Text style={[styles.sortChipText, sortBy === s.key && styles.sortChipTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Filter Panel */}
      {showFilter && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterLabel}>Location</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
            {NIGERIAN_LOCATIONS.slice(0, 8).map((loc) => (
              <TouchableOpacity
                key={loc}
                style={[styles.locChip, selectedLocations.includes(loc) && styles.locChipActive]}
                onPress={() => toggleLocation(loc)}
              >
                <Text style={[styles.locChipText, selectedLocations.includes(loc) && styles.locChipTextActive]}>
                  {loc}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.toggleRow}>
            <Text style={styles.filterLabel}>SIWES Only</Text>
            <TouchableOpacity
              style={[styles.toggle, siwesOnly && styles.toggleOn]}
              onPress={() => setSiwesOnly(!siwesOnly)}
            >
              <View style={[styles.toggleThumb, siwesOnly && styles.toggleThumbOn]} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() => { setSelectedLocations([]); setSiwesOnly(false); }}
          >
            <Text style={styles.resetBtnText}>Reset Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results Count */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primaryBlue} />
          <Text style={styles.loadingText}>Searching opportunities...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.resultsCount}>{filtered.length} opportunities found</Text>

          {/* Results List */}
          <FlatList
            data={filtered}
            keyExtractor={(i) => i.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <SearchX size={52} color={Colors.light.textMuted} />
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptyText}>Try adjusting your filters or search term</Text>
              </View>
            }
            renderItem={({ item }) => {
              const orgName = item.organisation_profiles?.name ?? 'Organisation';
              const initials = orgName.charAt(0).toUpperCase();
              const isSaved = savedIds.has(item.id);
              return (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => router.push(`/(app)/apply/${item.id}`)}
                >
                  <View style={styles.cardHeader}>
                  <View style={styles.cardLogo}>
                    {item.organisation_profiles?.logo_url ? (
                      <Image
                        source={{ uri: item.organisation_profiles.logo_url }}
                        style={styles.cardLogoImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.cardLogoText}>{initials}</Text>
                    )}
                  </View>
                    <View style={styles.cardHeaderRight}>
                      <View style={[
                        styles.matchBadge,
                        { backgroundColor: item.match >= 85 ? Colors.light.success + '20' : Colors.light.lightBlue },
                      ]}>
                        <Text style={[
                          styles.matchText,
                          { color: item.match >= 85 ? Colors.light.success : Colors.light.accentBlue },
                        ]}>
                          {item.match}% Match
                        </Text>
                      </View>
                      {item.is_siwes && (
                        <View style={styles.siwesTag}>
                          <Text style={styles.siwesTagText}>SIWES</Text>
                        </View>
                      )}
                      <TouchableOpacity onPress={() => toggleSave(item.id)}>
                        <Bookmark
                          size={18}
                          color={isSaved ? Colors.light.primaryBlue : Colors.light.textMuted}
                          fill={isSaved ? Colors.light.primaryBlue : 'none'}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.cardRole}>{item.title}</Text>
                  <Text style={styles.cardCompany}>{orgName}</Text>
                  <View style={styles.cardMeta}>
                    <View style={styles.cardMetaItem}>
                      <MapPin size={11} color={Colors.light.textMuted} />
                      <Text style={styles.cardMetaText}>{item.location ?? 'Remote'}</Text>
                    </View>
                    {item.duration && (
                      <View style={styles.cardMetaItem}>
                        <Clock size={11} color={Colors.light.textMuted} />
                        <Text style={styles.cardMetaText}>{item.duration}</Text>
                      </View>
                    )}
                    <View style={styles.cardMetaItem}>
                      <Clock size={11} color={Colors.light.textMuted} />
                      <Text style={styles.cardMetaText}>{timeSince(item.created_at)}</Text>
                    </View>
                  </View>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardSalary}>{formatNairaRange(item.salary_min ?? 0, item.salary_max ?? 0)}</Text>
                    <TouchableOpacity
                      style={styles.applyBtn}
                      onPress={() => router.push(`/(app)/apply/${item.id}`)}
                    >
                      <Text style={styles.applyBtnText}>Apply</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingTop: 60 },
  loadingText: { ...Typography.body, color: Colors.light.textMuted },
  header: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4,
    borderBottomWidth: 1, borderBottomColor: Colors.light.border,
  },
  headerTitle: { fontFamily: 'DMSans_700Bold', fontSize: 22, color: Colors.light.textDark, marginBottom: 14 },
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  searchWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.light.inputBg, borderWidth: 1.5,
    borderColor: Colors.light.inputBorder, borderRadius: Radii.lg, paddingHorizontal: 14, height: 48,
  },
  searchInput: { flex: 1, ...Typography.body, color: Colors.light.textDark, marginLeft: 8 },
  filterBtn: {
    width: 48, height: 48, backgroundColor: Colors.light.primaryBlue,
    borderRadius: Radii.lg, justifyContent: 'center', alignItems: 'center',
  },
  sortRow: { flexDirection: 'row', gap: 8, paddingBottom: 12 },
  sortChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50,
    backgroundColor: Colors.light.surfaceGrey, borderWidth: 1, borderColor: Colors.light.border,
  },
  sortChipActive: { backgroundColor: Colors.light.primaryBlue, borderColor: Colors.light.primaryBlue },
  sortChipText: { ...Typography.labelSemiBold, color: Colors.light.textMuted },
  sortChipTextActive: { color: '#FFFFFF' },

  // Filter Panel
  filterPanel: {
    backgroundColor: Colors.light.surface, paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.light.border,
  },
  filterLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.light.textDark, marginBottom: 10 },
  filterChips: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  locChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50,
    borderWidth: 1, borderColor: Colors.light.border, backgroundColor: Colors.light.white,
  },
  locChipActive: { backgroundColor: Colors.light.primaryBlue, borderColor: Colors.light.primaryBlue },
  locChipText: { ...Typography.micro, color: Colors.light.textDark },
  locChipTextActive: { color: '#FFFFFF' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  toggle: {
    width: 44, height: 24, borderRadius: 12, backgroundColor: Colors.light.border,
    justifyContent: 'center', paddingHorizontal: 2,
  },
  toggleOn: { backgroundColor: Colors.light.accentBlue },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF' },
  toggleThumbOn: { alignSelf: 'flex-end' },
  resetBtn: { alignSelf: 'flex-start' },
  resetBtnText: { ...Typography.labelSemiBold, color: Colors.light.error },

  resultsCount: {
    ...Typography.label, color: Colors.light.textMuted,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  listContent: { paddingHorizontal: 20, gap: 12, paddingBottom: 100 },
  card: {
    backgroundColor: Colors.light.white, borderRadius: Radii.card,
    padding: 16, borderWidth: 1, borderColor: Colors.light.cardBorder,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardLogo: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.light.lightBlue, justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  cardLogoImage: { width: 44, height: 44, borderRadius: 12 },
  cardLogoText: { fontFamily: 'DMSans_700Bold', fontSize: 18, color: Colors.light.primaryBlue },
  cardHeaderRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  matchBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  matchText: { fontFamily: 'DMSans_700Bold', fontSize: 11 },
  siwesTag: {
    backgroundColor: Colors.light.success + '20', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  siwesTagText: { fontFamily: 'DMSans_700Bold', fontSize: 10, color: Colors.light.success },
  cardRole: { fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.light.textDark, marginBottom: 3 },
  cardCompany: { ...Typography.label, color: Colors.light.textMuted, marginBottom: 10 },
  cardMeta: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  cardMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMetaText: { ...Typography.micro, color: Colors.light.textMuted },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardSalary: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.light.primaryBlue },
  applyBtn: {
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: Radii.button,
    borderWidth: 1.5, borderColor: Colors.light.primaryBlue,
  },
  applyBtnText: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.light.primaryBlue },

  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40, gap: 10 },
  emptyTitle: { fontFamily: 'DMSans_600SemiBold', fontSize: 18, color: Colors.light.textDark },
  emptyText: { ...Typography.body, color: Colors.light.textMuted, textAlign: 'center' },
});
