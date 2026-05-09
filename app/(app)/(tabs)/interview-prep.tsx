import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Typography, Radii } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Data ────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'all',       label: 'All',        emoji: '🗂️' },
  { id: 'general',   label: 'General',    emoji: '💬' },
  { id: 'technical', label: 'Technical',  emoji: '💻' },
  { id: 'hr',        label: 'HR',         emoji: '🤝' },
  { id: 'scenario',  label: 'Scenario',   emoji: '🧩' },
];

interface QAItem {
  id: string;
  category: 'general' | 'technical' | 'hr' | 'scenario';
  question: string;
  answer: string;
  tip: string;
}

const QA_BANK: QAItem[] = [
  {
    id: '1', category: 'general',
    question: 'Tell me about yourself.',
    answer: 'Start with your name, course of study, and year. Highlight 2–3 relevant strengths or experiences, then connect them to why you are excited about this internship.',
    tip: 'Keep it under 90 seconds. Practice it until it sounds natural, not rehearsed.',
  },
  {
    id: '2', category: 'general',
    question: 'Why do you want to intern with us?',
    answer: 'Research the company beforehand. Mention a specific project, product, or value that genuinely excites you, then explain how your skills align with their needs.',
    tip: 'Avoid generic answers like "you are a great company." Be specific.',
  },
  {
    id: '3', category: 'hr',
    question: 'What is your greatest weakness?',
    answer: 'Choose a real but manageable weakness. Explain what you have done to actively improve it. Show self-awareness and growth mindset.',
    tip: "Don't say \"I work too hard\" — interviewers can see through that. Be honest and solution-focused.",
  },
  {
    id: '4', category: 'hr',
    question: 'Where do you see yourself in 5 years?',
    answer: 'Talk about growing your skills and taking on more responsibility within a relevant field. Show ambition without being unrealistic. Mention how this internship fits into your journey.',
    tip: 'Align your answer with the company\'s industry so they see you as a long-term investment.',
  },
  {
    id: '5', category: 'technical',
    question: 'Explain the difference between a stack and a queue.',
    answer: 'A stack follows LIFO (Last In, First Out) — the last element added is the first removed. A queue follows FIFO (First In, First Out) — the first element added is the first removed. Stacks are used in undo operations; queues in task scheduling.',
    tip: 'Use a real-world analogy: stack = a pile of plates; queue = a line of people.',
  },
  {
    id: '6', category: 'technical',
    question: 'What is the difference between SQL and NoSQL databases?',
    answer: 'SQL databases are relational and use structured tables with fixed schemas (e.g. MySQL, PostgreSQL). NoSQL databases are non-relational, flexible, and handle unstructured data (e.g. MongoDB, Firebase). SQL suits complex queries; NoSQL suits high-volume, flexible data.',
    tip: 'Give an example use case for each to show depth of understanding.',
  },
  {
    id: '7', category: 'scenario',
    question: 'You disagree with your supervisor\'s decision. What do you do?',
    answer: 'First, seek to understand their reasoning fully. Then, request a private moment to respectfully share your perspective with data or evidence to back it up. If the decision stands, support it professionally while documenting your concerns.',
    tip: 'Show maturity. Interviewers want to see that you can be assertive without being disruptive.',
  },
  {
    id: '8', category: 'scenario',
    question: 'You are given 3 tasks but only have time for 2. What do you do?',
    answer: 'Prioritise by urgency and impact. Communicate proactively with your manager about the constraint, propose which tasks to deprioritise, and suggest a timeline for the third. Never silently drop a task.',
    tip: 'Demonstrate time management and communication skills — both are key for interns.',
  },
  {
    id: '9', category: 'general',
    question: 'What are your greatest strengths?',
    answer: 'Pick 2–3 strengths relevant to the role. Back each one up with a brief, real example. Focus on strengths like problem-solving, communication, or fast learning.',
    tip: "Use the STAR method (Situation, Task, Action, Result) to give your examples structure.",
  },
  {
    id: '10', category: 'hr',
    question: 'How do you handle stress and pressure?',
    answer: 'Describe a real instance where you worked under pressure. Explain the coping strategies you used — breaking tasks into steps, prioritising, or communicating early. End with a positive outcome.',
    tip: 'Employers want to know you will not freeze or panic. Show composure and adaptability.',
  },
];

// Oral practice prompts
const ORAL_PROMPTS = [
  { emoji: '🎤', title: 'Introduction Round', desc: 'Practice introducing yourself clearly and confidently in under 90 seconds.' },
  { emoji: '🧠', title: 'Behavioural Round', desc: 'Answer HR and behavioural questions using the STAR method.' },
  { emoji: '💻', title: 'Technical Round', desc: 'Practise explaining technical concepts out loud in simple terms.' },
  { emoji: '🎯', title: 'Mock Interview', desc: 'Simulate a full 5-question interview session under timed conditions.' },
];

const ORAL_TIPS = [
  'Maintain steady eye contact (or look at the camera in virtual interviews).',
  'Speak clearly and at a moderate pace — do not rush.',
  'Use the STAR method: Situation → Task → Action → Result.',
  'Pause briefly before answering — it shows you are thoughtful.',
  'Mirror positive body language: sit upright, smile naturally.',
  'Avoid filler words: "um", "like", "you know".',
  'Prepare 2–3 questions to ask your interviewer at the end.',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function QACard({ item }: { item: QAItem }) {
  const [expanded, setExpanded] = useState(false);
  const animRef = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    Animated.spring(animRef, {
      toValue: expanded ? 0 : 1,
      useNativeDriver: false,
      friction: 8,
    }).start();
    setExpanded((v) => !v);
  };

  const categoryColors: Record<string, string> = {
    general: '#6366F1', technical: '#0EA5E9', hr: '#22C55E', scenario: '#F59E0B',
  };
  const color = categoryColors[item.category] ?? Colors.light.accentBlue;

  return (
    <TouchableOpacity style={styles.qaCard} onPress={toggle} activeOpacity={0.85}>
      <View style={styles.qaCardTop}>
        <View style={[styles.qaCategoryBadge, { backgroundColor: color + '18' }]}>
          <Text style={[styles.qaCategoryText, { color }]}>{item.category}</Text>
        </View>
        <Text style={styles.qaToggleIcon}>{expanded ? '▲' : '▼'}</Text>
      </View>
      <Text style={styles.qaQuestion}>{item.question}</Text>

      {expanded && (
        <Animated.View style={styles.qaExpanded}>
          <View style={[styles.qaAnswerBox, { borderLeftColor: color }]}>
            <Text style={styles.qaAnswerLabel}>💡 Model Answer</Text>
            <Text style={styles.qaAnswerText}>{item.answer}</Text>
          </View>
          <View style={styles.qaTipBox}>
            <Text style={styles.qaTipLabel}>🎯 Pro Tip</Text>
            <Text style={styles.qaTipText}>{item.tip}</Text>
          </View>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function InterviewPrepScreen() {
  const [mode, setMode] = useState<'oral' | 'qa'>('oral');
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = activeCategory === 'all'
    ? QA_BANK
    : QA_BANK.filter((q) => q.category === activeCategory);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <LinearGradient
          colors={[Colors.light.primaryBlue, Colors.light.accentBlue]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <Text style={styles.headerTitle}>Interview Prep</Text>
          <Text style={styles.headerSub}>Get ready to land that internship 🚀</Text>

          {/* Mode Toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'oral' && styles.modeBtnActive]}
              onPress={() => setMode('oral')}
            >
              <Text style={[styles.modeBtnText, mode === 'oral' && styles.modeBtnTextActive]}>
                🎤 Oral Practice
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'qa' && styles.modeBtnActive]}
              onPress={() => setMode('qa')}
            >
              <Text style={[styles.modeBtnText, mode === 'qa' && styles.modeBtnTextActive]}>
                📋 Q&amp;A Bank
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ── ORAL MODE ── */}
        {mode === 'oral' && (
          <View style={styles.modeContent}>
            <Text style={styles.sectionTitle}>Practice Rounds</Text>
            <Text style={styles.sectionSub}>
              Select a round to practise out loud. Use the tips below to improve your delivery.
            </Text>

            {ORAL_PROMPTS.map((p, i) => (
              <TouchableOpacity key={i} style={styles.promptCard} activeOpacity={0.8}>
                <View style={styles.promptCardLeft}>
                  <Text style={styles.promptEmoji}>{p.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.promptTitle}>{p.title}</Text>
                    <Text style={styles.promptDesc}>{p.desc}</Text>
                  </View>
                </View>
                <View style={styles.promptArrow}>
                  <Text style={styles.promptArrowText}>›</Text>
                </View>
              </TouchableOpacity>
            ))}

            <Text style={styles.sectionTitle}>Oral Interview Tips</Text>
            {ORAL_TIPS.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <View style={styles.tipDot} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}

            {/* Confidence banner */}
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              style={styles.confidenceBanner}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Text style={styles.confidenceEmoji}>🏆</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.confidenceTitle}>Build Confidence Daily</Text>
                <Text style={styles.confidenceSub}>
                  Record yourself answering one question each day and review the playback.
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* ── Q&A MODE ── */}
        {mode === 'qa' && (
          <View style={styles.modeContent}>
            <Text style={styles.sectionTitle}>Question Bank</Text>
            <Text style={styles.sectionSub}>
              Tap any question to reveal a model answer and a pro tip.
            </Text>

            {/* Category filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
            >
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catChip, activeCategory === cat.id && styles.catChipActive]}
                  onPress={() => setActiveCategory(cat.id)}
                >
                  <Text style={styles.catChipEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.catChipText, activeCategory === cat.id && styles.catChipTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.countLabel}>{filtered.length} questions</Text>

            {filtered.map((item) => (
              <QACard key={item.id} item={item} />
            ))}

            {/* Prep reminder */}
            <View style={styles.prepReminder}>
              <Text style={styles.prepReminderIcon}>📌</Text>
              <Text style={styles.prepReminderText}>
                Review at least 3 questions per day. Consistency builds real confidence.
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  scroll: { flexGrow: 1 },

  // Header
  headerGradient: { paddingTop: 24, paddingBottom: 32, paddingHorizontal: 20 },
  headerTitle: { fontFamily: 'DMSans_700Bold', fontSize: 26, color: '#FFFFFF', marginBottom: 4 },
  headerSub: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 20 },

  // Mode toggle
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14, padding: 4,
  },
  modeBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
  },
  modeBtnActive: { backgroundColor: '#FFFFFF' },
  modeBtnText: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  modeBtnTextActive: { color: Colors.light.primaryBlue },

  // Shared content wrapper
  modeContent: { paddingHorizontal: 20, paddingTop: 24 },

  sectionTitle: {
    fontFamily: 'DMSans_700Bold', fontSize: 17,
    color: Colors.light.textDark, marginBottom: 6,
  },
  sectionSub: {
    ...Typography.body, color: Colors.light.textMuted,
    marginBottom: 20, lineHeight: 22,
  },

  // ── Oral Mode ──
  promptCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.light.white,
    borderRadius: Radii.card, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: Colors.light.cardBorder,
  },
  promptCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  promptEmoji: { fontSize: 32 },
  promptTitle: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.light.textDark, marginBottom: 3 },
  promptDesc: { ...Typography.micro, color: Colors.light.textMuted, lineHeight: 18 },
  promptArrow: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.light.lightBlue,
    alignItems: 'center', justifyContent: 'center',
  },
  promptArrowText: { fontSize: 20, color: Colors.light.accentBlue, lineHeight: 24 },

  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  tipDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: Colors.light.accentBlue, marginTop: 6,
  },
  tipText: { flex: 1, ...Typography.body, color: Colors.light.textDark, lineHeight: 22 },

  confidenceBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: Radii.card, padding: 18, marginTop: 28,
  },
  confidenceEmoji: { fontSize: 36 },
  confidenceTitle: { fontFamily: 'DMSans_700Bold', fontSize: 14, color: '#FFFFFF', marginBottom: 4 },
  confidenceSub: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 18 },

  // ── Q&A Mode ──
  categoryRow: { gap: 8, paddingBottom: 16 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 50, backgroundColor: Colors.light.surfaceGrey,
    borderWidth: 1, borderColor: Colors.light.border,
  },
  catChipActive: {
    backgroundColor: Colors.light.lightBlue,
    borderColor: Colors.light.accentBlue,
  },
  catChipEmoji: { fontSize: 14 },
  catChipText: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: Colors.light.textMuted },
  catChipTextActive: { color: Colors.light.accentBlue, fontFamily: 'DMSans_600SemiBold' },

  countLabel: {
    ...Typography.micro, color: Colors.light.textMuted,
    marginBottom: 14,
  },

  qaCard: {
    backgroundColor: Colors.light.white,
    borderRadius: Radii.card, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: Colors.light.cardBorder,
  },
  qaCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  qaCategoryBadge: {
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 20,
  },
  qaCategoryText: { fontFamily: 'DMSans_600SemiBold', fontSize: 11, textTransform: 'capitalize' },
  qaToggleIcon: { fontSize: 11, color: Colors.light.textMuted },
  qaQuestion: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.light.textDark, lineHeight: 22 },

  qaExpanded: { marginTop: 14, gap: 10 },
  qaAnswerBox: {
    backgroundColor: Colors.light.surfaceGrey,
    borderLeftWidth: 3, borderRadius: 8, padding: 12,
  },
  qaAnswerLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: Colors.light.textDark, marginBottom: 6 },
  qaAnswerText: { ...Typography.body, color: Colors.light.textDark, lineHeight: 22 },
  qaTipBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8, padding: 12,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  qaTipLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: '#92400E', marginBottom: 5 },
  qaTipText: { ...Typography.body, color: '#78350F', lineHeight: 22 },

  prepReminder: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: Colors.light.lightBlue,
    borderRadius: 12, padding: 14, marginTop: 8,
  },
  prepReminderIcon: { fontSize: 18 },
  prepReminderText: { flex: 1, ...Typography.body, color: Colors.light.primaryBlue, lineHeight: 22 },
});
