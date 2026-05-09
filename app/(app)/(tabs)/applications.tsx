import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Typography, Radii } from '@/constants/theme';
import { Inbox, ChevronUp, ChevronDown } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

type AppStatus = 'All' | 'Pending' | 'Reviewed' | 'Accepted' | 'Rejected';

interface Application {
  id: string;
  status: string;
  cover_letter: string | null;
  timeline: string[];
  applied_at: string;
  internship_listings: {
    id: string;
    title: string;
    organisation_profiles: { name: string; logo_url: string | null } | null;
  } | null;
}

const STATUS_COLORS: Record<string, string> = {
  Pending: '#F59E0B',
  Reviewed: Colors.light.accentBlue,
  Accepted: Colors.light.success,
  Rejected: Colors.light.error,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function ApplicationsScreen() {
  const { profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AppStatus>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const TABS: AppStatus[] = ['All', 'Pending', 'Reviewed', 'Accepted', 'Rejected'];

  const fetchApplications = useCallback(async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('applications')
      .select('id, status, cover_letter, timeline, applied_at, internship_listings(id, title, organisation_profiles(name, logo_url))')
      .eq('student_id', profile.id)
      .order('applied_at', { ascending: false });

    if (!error && data) {
      setApplications(data as Application[]);
    }
    setIsLoading(false);
  }, [profile?.id]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const filtered = applications.filter(
    (a) => activeTab === 'All' || a.status === activeTab
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Applications</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primaryBlue} />
          <Text style={styles.loadingText}>Loading applications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Applications</Text>
        <Text style={styles.headerSub}>{applications.length} application{applications.length !== 1 ? 's' : ''} total</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabChip, activeTab === tab && styles.tabChipActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabChipText, activeTab === tab && styles.tabChipTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Application List */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onRefresh={fetchApplications}
        refreshing={isLoading}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Inbox size={56} color={Colors.light.textMuted} />
            <Text style={styles.emptyTitle}>
              {activeTab === 'All' ? 'No applications yet' : `No ${activeTab} applications`}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'All'
                ? 'Start applying to internships from the Search tab'
                : 'Applications in this category will appear here.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isExpanded = expandedId === item.id;
          const statusColor = STATUS_COLORS[item.status] ?? Colors.light.textMuted;
          const orgName = item.internship_listings?.organisation_profiles?.name ?? 'Organisation';
          const orgInitial = orgName.charAt(0).toUpperCase();
          const timeline: string[] = Array.isArray(item.timeline) ? item.timeline : [];

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => setExpandedId(isExpanded ? null : item.id)}
            >
              <View style={styles.cardTop}>
                <View style={styles.logoWrap}>
                  <Text style={styles.logoText}>{orgInitial}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardRole} numberOfLines={2}>
                    {item.internship_listings?.title ?? 'Internship Position'}
                  </Text>
                  <Text style={styles.cardCompany}>{orgName}</Text>
                  <Text style={styles.cardDate}>Applied {formatDate(item.applied_at)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
                </View>
              </View>

              {/* Timeline */}
              {isExpanded && (
                <View style={styles.timeline}>
                  <View style={styles.timelineDivider} />
                  {timeline.length > 0 ? (
                    timeline.map((step, i) => (
                      <View key={i} style={styles.timelineStep}>
                        <View style={[
                          styles.timelineDot,
                          { backgroundColor: i === timeline.length - 1 ? statusColor : Colors.light.success },
                        ]} />
                        <Text style={styles.timelineText}>{step}</Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.timelineStep}>
                      <View style={[styles.timelineDot, { backgroundColor: Colors.light.primaryBlue }]} />
                      <Text style={styles.timelineText}>Applied</Text>
                    </View>
                  )}
                  {item.cover_letter && (
                    <View style={styles.coverLetterBox}>
                      <Text style={styles.coverLetterLabel}>Your note:</Text>
                      <Text style={styles.coverLetterText} numberOfLines={3}>{item.cover_letter}</Text>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.expandHint}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  {isExpanded
                    ? <ChevronUp size={14} color={Colors.light.textMuted} />
                    : <ChevronDown size={14} color={Colors.light.textMuted} />
                  }
                  <Text style={styles.expandHintText}>{isExpanded ? 'Hide' : 'View timeline'}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { ...Typography.body, color: Colors.light.textMuted },
  header: {
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.light.border,
  },
  headerTitle: { fontFamily: 'DMSans_700Bold', fontSize: 22, color: Colors.light.textDark },
  headerSub: { ...Typography.label, color: Colors.light.textMuted, marginTop: 2 },
  tabsWrapper: { paddingVertical: 14 },
  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, alignItems: 'center' },
  tabChip: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 50,
    backgroundColor: Colors.light.surfaceGrey, borderWidth: 1, borderColor: Colors.light.border,
  },
  tabChipActive: { backgroundColor: Colors.light.primaryBlue, borderColor: Colors.light.primaryBlue },
  tabChipText: { ...Typography.labelSemiBold, color: Colors.light.textMuted },
  tabChipTextActive: { color: '#FFFFFF' },
  listContent: { paddingHorizontal: 20, gap: 12, paddingBottom: 100 },
  card: {
    backgroundColor: Colors.light.white, borderRadius: Radii.card,
    padding: 16, borderWidth: 1, borderColor: Colors.light.cardBorder,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  logoWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.light.lightBlue, justifyContent: 'center', alignItems: 'center',
  },
  logoText: { fontFamily: 'DMSans_700Bold', fontSize: 20, color: Colors.light.primaryBlue },
  cardInfo: { flex: 1 },
  cardRole: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.light.textDark, marginBottom: 2 },
  cardCompany: { ...Typography.label, color: Colors.light.textMuted, marginBottom: 3 },
  cardDate: { ...Typography.micro, color: Colors.light.textMuted },
  statusBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  statusText: { fontFamily: 'DMSans_700Bold', fontSize: 11 },
  timeline: { marginTop: 16, paddingTop: 16, gap: 12 },
  timelineDivider: { height: 1, backgroundColor: Colors.light.borderLight, marginBottom: 4 },
  timelineStep: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timelineDot: { width: 10, height: 10, borderRadius: 5 },
  timelineText: { ...Typography.body, color: Colors.light.textDark },
  coverLetterBox: {
    marginTop: 8, backgroundColor: Colors.light.surfaceGrey,
    borderRadius: 10, padding: 12,
  },
  coverLetterLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: Colors.light.textMuted, marginBottom: 4 },
  coverLetterText: { ...Typography.body, color: Colors.light.textDark },
  expandHint: { marginTop: 12, alignItems: 'center' },
  expandHintText: { ...Typography.micro, color: Colors.light.textMuted },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontFamily: 'Fraunces_700Bold', fontSize: 22, color: Colors.light.textDark },
  emptyText: { ...Typography.body, color: Colors.light.textMuted, textAlign: 'center', paddingHorizontal: 20 },
});
