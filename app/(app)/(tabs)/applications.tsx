import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Typography, Radii } from '@/constants/theme';
import { Inbox, ChevronUp, ChevronDown } from 'lucide-react-native';

type AppStatus = 'All' | 'Pending' | 'Reviewed' | 'Accepted' | 'Rejected';

const APPLICATIONS = [
  {
    id: '1', role: 'Frontend Developer Intern', company: 'Paystack', logo: '💳',
    dateApplied: 'Apr 22, 2026', status: 'Pending',
    timeline: ['Applied', 'Under Review'],
  },
  {
    id: '2', role: 'UI/UX Design Intern', company: 'Flutterwave', logo: '💸',
    dateApplied: 'Apr 19, 2026', status: 'Reviewed',
    timeline: ['Applied', 'Under Review', 'Shortlisted'],
  },
  {
    id: '3', role: 'Data Analyst Intern', company: 'Access Bank', logo: '🏦',
    dateApplied: 'Apr 15, 2026', status: 'Accepted',
    timeline: ['Applied', 'Under Review', 'Shortlisted', 'Accepted ✓'],
  },
  {
    id: '4', role: 'Content Creator Intern', company: 'TechCabal', logo: '📰',
    dateApplied: 'Apr 10, 2026', status: 'Rejected',
    timeline: ['Applied', 'Under Review', 'Rejected'],
  },
  {
    id: '5', role: 'Backend Engineer Intern', company: 'Andela', logo: '🅐',
    dateApplied: 'Apr 8, 2026', status: 'Pending',
    timeline: ['Applied'],
  },
];

const STATUS_COLORS: Record<string, string> = {
  Pending: '#F59E0B',
  Reviewed: Colors.light.accentBlue,
  Accepted: Colors.light.success,
  Rejected: Colors.light.error,
};

export default function ApplicationsScreen() {
  const [activeTab, setActiveTab] = useState<AppStatus>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const TABS: AppStatus[] = ['All', 'Pending', 'Reviewed', 'Accepted', 'Rejected'];

  const filtered = APPLICATIONS.filter(
    (a) => activeTab === 'All' || a.status === activeTab
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Applications</Text>
        <Text style={styles.headerSub}>{APPLICATIONS.length} applications total</Text>
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
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Inbox size={56} color={Colors.light.textMuted} />
            <Text style={styles.emptyTitle}>No applications yet</Text>
            <Text style={styles.emptyText}>Applications in this category will appear here.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isExpanded = expandedId === item.id;
          const statusColor = STATUS_COLORS[item.status];
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => setExpandedId(isExpanded ? null : item.id)}
            >
              <View style={styles.cardTop}>
                <View style={styles.logoWrap}>
                  <Text style={styles.logoText}>{item.logo}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardRole}>{item.role}</Text>
                  <Text style={styles.cardCompany}>{item.company}</Text>
                  <Text style={styles.cardDate}>Applied {item.dateApplied}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
                </View>
              </View>

              {/* Timeline */}
              {isExpanded && (
                <View style={styles.timeline}>
                  <View style={styles.timelineDivider} />
                  {item.timeline.map((step, i) => (
                    <View key={i} style={styles.timelineStep}>
                      <View style={[
                        styles.timelineDot,
                        { backgroundColor: i === item.timeline.length - 1 ? statusColor : Colors.light.success }
                      ]} />
                      <Text style={styles.timelineText}>{step}</Text>
                    </View>
                  ))}
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
  logoText: { fontSize: 22 },
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
  expandHint: { marginTop: 12, alignItems: 'center' },
  expandHintText: { ...Typography.micro, color: Colors.light.textMuted },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontFamily: 'Fraunces_700Bold', fontSize: 22, color: Colors.light.textDark },
  emptyText: { ...Typography.body, color: Colors.light.textMuted, textAlign: 'center' },
});
