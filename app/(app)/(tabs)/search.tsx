import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Typography, Radii } from '@/constants/theme';
import { formatNairaRange, NIGERIAN_LOCATIONS } from '@/constants/AppData';

const ALL_INTERNSHIPS = [
  { id: '1', role: 'Frontend Developer Intern', company: 'Paystack', location: 'Remote', salaryMin: 80000, salaryMax: 120000, match: 94, daysAgo: 1, logo: '💳', siwes: false },
  { id: '2', role: 'UI/UX Design Intern', company: 'Flutterwave', location: 'Lagos', salaryMin: 70000, salaryMax: 100000, match: 88, daysAgo: 2, logo: '💸', siwes: false },
  { id: '3', role: 'Data Analyst Intern', company: 'Access Bank', location: 'Abuja', salaryMin: 60000, salaryMax: 90000, match: 82, daysAgo: 3, logo: '🏦', siwes: false },
  { id: '4', role: 'Backend Engineer Intern', company: 'Andela', location: 'Remote', salaryMin: 90000, salaryMax: 130000, match: 91, daysAgo: 1, logo: '🅐', siwes: false },
  { id: '5', role: 'Product Design Intern', company: 'Piggyvest', location: 'Lagos', salaryMin: 65000, salaryMax: 95000, match: 86, daysAgo: 4, logo: '🐷', siwes: false },
  { id: '6', role: 'Mechanical Eng. Intern (SIWES)', company: 'Dangote Group', location: 'Lagos', salaryMin: 40000, salaryMax: 60000, match: 78, daysAgo: 2, logo: '🏗', siwes: true },
  { id: '7', role: 'Accounting Intern', company: 'KPMG Nigeria', location: 'Abuja', salaryMin: 70000, salaryMax: 100000, match: 85, daysAgo: 5, logo: '📊', siwes: false },
  { id: '8', role: 'IT Intern (SIWES)', company: 'NNPC', location: 'Port Harcourt', salaryMin: 40000, salaryMax: 60000, match: 80, daysAgo: 1, logo: '⛽', siwes: true },
  { id: '9', role: 'Content Creator Intern', company: 'TechCabal', location: 'Lagos', salaryMin: 45000, salaryMax: 70000, match: 73, daysAgo: 6, logo: '📰', siwes: false },
  { id: '10', role: 'Finance Intern', company: 'First Bank', location: 'Remote', salaryMin: 55000, salaryMax: 80000, match: 77, daysAgo: 3, logo: '🏧', siwes: false },
];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('match');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [siwesOnly, setSiwesOnly] = useState(false);

  const filtered = ALL_INTERNSHIPS.filter((item) => {
    const matchesQuery = !query || item.role.toLowerCase().includes(query.toLowerCase()) || item.company.toLowerCase().includes(query.toLowerCase());
    const matchesLocation = selectedLocations.length === 0 || selectedLocations.includes(item.location);
    const matchesSiwes = !siwesOnly || item.siwes;
    return matchesQuery && matchesLocation && matchesSiwes;
  }).sort((a, b) => {
    if (sortBy === 'match') return b.match - a.match;
    if (sortBy === 'salary') return b.salaryMax - a.salaryMax;
    if (sortBy === 'date') return a.daysAgo - b.daysAgo;
    return 0;
  });

  const toggleLocation = (loc: string) => {
    setSelectedLocations((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Search Bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Internships</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search roles, companies..."
              placeholderTextColor={Colors.light.placeholder}
              value={query}
              onChangeText={setQuery}
            />
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilter(!showFilter)}>
            <Text style={styles.filterIcon}>⚙️</Text>
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
          <TouchableOpacity style={styles.resetBtn} onPress={() => { setSelectedLocations([]); setSiwesOnly(false); }}>
            <Text style={styles.resetBtnText}>Reset Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results Count */}
      <Text style={styles.resultsCount}>{filtered.length} opportunities found</Text>

      {/* Results List */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardLogo}>
                <Text style={styles.cardLogoText}>{item.logo}</Text>
              </View>
              <View style={styles.cardHeaderRight}>
                <View style={[styles.matchBadge, { backgroundColor: item.match >= 85 ? Colors.light.success + '20' : Colors.light.lightBlue }]}>
                  <Text style={[styles.matchText, { color: item.match >= 85 ? Colors.light.success : Colors.light.accentBlue }]}>
                    {item.match}% Match
                  </Text>
                </View>
                {item.siwes && (
                  <View style={styles.siwesTag}>
                    <Text style={styles.siwesTagText}>SIWES</Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.cardRole}>{item.role}</Text>
            <Text style={styles.cardCompany}>{item.company}</Text>
            <View style={styles.cardMeta}>
              <Text style={styles.cardMetaText}>📍 {item.location}</Text>
              <Text style={styles.cardMetaText}>🕐 {item.daysAgo === 1 ? 'Today' : `${item.daysAgo}d ago`}</Text>
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.cardSalary}>{formatNairaRange(item.salaryMin, item.salaryMax)}</Text>
              <TouchableOpacity style={styles.applyBtn}>
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
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
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, ...Typography.body, color: Colors.light.textDark },
  filterBtn: {
    width: 48, height: 48, backgroundColor: Colors.light.primaryBlue,
    borderRadius: Radii.lg, justifyContent: 'center', alignItems: 'center',
  },
  filterIcon: { fontSize: 18 },
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
  },
  cardLogoText: { fontSize: 20 },
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
  cardMetaText: { ...Typography.micro, color: Colors.light.textMuted },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardSalary: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.light.primaryBlue },
  applyBtn: {
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: Radii.button,
    borderWidth: 1.5, borderColor: Colors.light.primaryBlue,
  },
  applyBtnText: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.light.primaryBlue },
});
