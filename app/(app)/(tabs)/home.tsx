import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, FlatList,
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
import { Search, SlidersHorizontal, MapPin, Clock } from 'lucide-react-native';

// ---------- MOCK DATA ----------
const FEATURED = [
  {
    id: '1', role: 'Frontend Developer Intern', company: 'Paystack',
    salaryMin: 80000, salaryMax: 120000, match: 94,
    gradient: ['#1A3A6B', '#2D6BE4'] as const,
  },
  {
    id: '2', role: 'UI/UX Design Intern', company: 'Flutterwave',
    salaryMin: 70000, salaryMax: 100000, match: 88,
    gradient: ['#0D2348', '#1A3A6B'] as const,
  },
  {
    id: '3', role: 'Data Analyst Intern', company: 'Access Bank',
    salaryMin: 60000, salaryMax: 90000, match: 82,
    gradient: ['#1A4060', '#2D6BE4'] as const,
  },
];

const RECOMMENDED = [
  {
    id: '1', role: 'Backend Developer', company: 'Andela',
    location: 'Remote', salaryMin: 90000, salaryMax: 130000, match: 91, logo: '🅐',
  },
  {
    id: '2', role: 'Product Design Intern', company: 'Piggyvest',
    location: 'Lagos', salaryMin: 65000, salaryMax: 95000, match: 86, logo: '🐷',
  },
  {
    id: '3', role: 'Marketing Intern', company: 'Konga',
    location: 'Lagos', salaryMin: 50000, salaryMax: 75000, match: 79, logo: '🛒',
  },
  {
    id: '4', role: 'Accounting Intern', company: 'KPMG Nigeria',
    location: 'Abuja', salaryMin: 70000, salaryMax: 100000, match: 85, logo: '🏦',
  },
];

const RECENT = [
  { id: '1', role: 'Software Engineer Intern', company: 'Google Nigeria', time: '2hrs ago', location: 'Lagos', isNew: true },
  { id: '2', role: 'Data Science Intern', company: 'MTN Nigeria', time: '5hrs ago', location: 'Abuja', isNew: true },
  { id: '3', role: 'Mechanical Eng. Intern', company: 'Dangote Group', time: '1d ago', location: 'Lagos', isNew: false },
  { id: '4', role: 'Finance Intern', company: 'First Bank', time: '2d ago', location: 'Remote', isNew: false },
];

const SIWES = [
  { id: '1', role: 'IT Intern (SIWES)', company: 'NNPC', location: 'Port Harcourt', salaryMin: 40000, salaryMax: 60000 },
  { id: '2', role: 'Engineering Intern (SIWES)', company: 'Julius Berger', location: 'Abuja', salaryMin: 35000, salaryMax: 55000 },
];

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const firstName = profile?.first_name ?? 'Student';
  const greeting = getGreeting();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

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
            <LinearGradient
              colors={[Colors.light.accentBlue, Colors.light.primaryBlue]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {firstName.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
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
        <Text style={styles.sectionTitle}>Featured Opportunities</Text>
        <FlatList
          data={FEATURED}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={320 + 14}
          decelerationRate="fast"
          contentContainerStyle={styles.featuredList}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <LinearGradient colors={item.gradient} style={styles.featuredCard}>
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>{item.match}% Match</Text>
              </View>
              <Text style={styles.featuredRole}>{item.role}</Text>
              <Text style={styles.featuredCompany}>{item.company}</Text>
              <View style={styles.featuredFooter}>
                <Text style={styles.featuredSalary}>
                  {formatNairaRange(item.salaryMin, item.salaryMax)}
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
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended For You</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/search')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.recommendedGrid}>
          {RECOMMENDED.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.recCard}
              onPress={() => router.push(`/(app)/apply/${item.id}`)}
            >
              <View style={styles.recHeader}>
                <View style={styles.recLogo}>
                  <Text style={styles.recLogoText}>{item.logo}</Text>
                </View>
                <View style={styles.recMatchBadge}>
                  <Text style={styles.recMatchText}>{item.match}%</Text>
                </View>
              </View>
              <Text style={styles.recRole} numberOfLines={2}>{item.role}</Text>
              <Text style={styles.recCompany}>{item.company}</Text>
              <View style={styles.recLocation}>
                <MapPin size={11} color={Colors.light.textMuted} />
                <Text style={styles.recLocationText}>{item.location}</Text>
              </View>
              <Text style={styles.recSalary}>{formatNairaRange(item.salaryMin, item.salaryMax)}</Text>
              <View style={styles.recMatchBar}>
                <View style={[styles.recMatchFill, { width: `${item.match}%` }]} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ——— RECENTLY POSTED ——— */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recently Posted</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/search')}>
            <Text style={styles.viewAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={RECENT}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentList}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.recentCard}
              onPress={() => router.push(`/(app)/apply/${item.id}`)}
            >
              {item.isNew && (
                <View style={styles.newBadge}><Text style={styles.newBadgeText}>New</Text></View>
              )}
              <Text style={styles.recentRole} numberOfLines={2}>{item.role}</Text>
              <Text style={styles.recentCompany}>{item.company}</Text>
              <View style={styles.recentMetaRow}>
                <MapPin size={10} color={Colors.light.textMuted} />
                <Text style={styles.recentMeta}>{item.location}</Text>
                <Text style={styles.recentMeta}> · </Text>
                <Clock size={10} color={Colors.light.textMuted} />
                <Text style={styles.recentMeta}>{item.time}</Text>
              </View>
            </TouchableOpacity>
          )}
        />

        {/* ——— SIWES SECTION ——— */}
        <View style={styles.siwesSection}>
          <View style={styles.siwesHeader}>
            <Text style={styles.siwesTitle}>SIWES Opportunities</Text>
            <Text style={styles.siwesSubtitle}>
              Approved industrial training placements for your programme
            </Text>
          </View>
          {SIWES.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.siwesCard}
              onPress={() => router.push(`/(app)/apply/${item.id}`)}
            >
              <View style={styles.siwesEligibleBadge}>
                <Text style={styles.siwesEligibleText}>SIWES Eligible</Text>
              </View>
              <Text style={styles.siwesRole}>{item.role}</Text>
              <Text style={styles.siwesCompany}>{item.company}</Text>
              <View style={styles.siwesFooter}>
                <View style={styles.siwesMetaRow}>
                  <MapPin size={10} color="rgba(255,255,255,0.6)" />
                  <Text style={styles.siwesMeta}>{item.location}</Text>
                </View>
                <Text style={styles.siwesSalary}>{formatNairaRange(item.salaryMin, item.salaryMax)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  scroll: { flex: 1 },

  // Top Bar
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  greeting: { fontFamily: 'DMSans_600SemiBold', fontSize: 18, color: Colors.light.textDark },
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
  filterIcon: { fontSize: 18 },

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
  },
  recLogoText: { fontSize: 18 },
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
});
