import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Typography, Radii } from '@/constants/theme';
import {
  generateInterviewQuestions, gradeInterviewSession,
  InterviewQuestion, InterviewQA, InterviewGrade,
} from '@/lib/nvidia';
import {
  Mic, FileText, Zap, Target, Code2, MessageSquare,
  CheckCircle2, AlertTriangle, Lightbulb, RotateCcw,
  Layers, Rocket, Sparkles, Users,
} from 'lucide-react-native';

const C = Colors.light;
const { width: SW } = Dimensions.get('window');

type Mode = 'oral' | 'qa';
type Phase = 'role' | 'loading_q' | 'interview' | 'grading' | 'result';

const TYPE_COLOR: Record<string, string> = {
  technical: '#0EA5E9',
  behavioural: '#22C55E',
  scenario: '#F59E0B',
  general: '#6366F1',
};

const TYPE_LABEL: Record<string, string> = {
  technical: 'Technical',
  behavioural: 'Behavioural',
  scenario: 'Scenario',
  general: 'General',
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  technical:   <Code2 size={11} color={TYPE_COLOR.technical} />,
  behavioural: <Users size={11} color={TYPE_COLOR.behavioural} />,
  scenario:    <Target size={11} color={TYPE_COLOR.scenario} />,
  general:     <MessageSquare size={11} color={TYPE_COLOR.general} />,
};

const GRADE_COLOR: Record<string, string> = {
  A: '#22C55E', B: '#84CC16', C: '#F59E0B', D: '#F97316', F: '#EF4444',
};

export default function InterviewPrepScreen() {
  const [mode, setMode] = useState<Mode>('oral');
  const [phase, setPhase] = useState<Phase>('role');
  const [role, setRole] = useState('');
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [grade, setGrade] = useState<InterviewGrade | null>(null);
  const [loadingMsg, setLoadingMsg] = useState('');

  const scrollRef = useRef<ScrollView>(null);

  const resetAll = () => {
    setPhase('role');
    setRole('');
    setQuestions([]);
    setAnswers([]);
    setCurrentQ(0);
    setGrade(null);
  };

  const handleModeSwitch = (m: Mode) => {
    setMode(m);
    resetAll();
  };

  const handleStart = async () => {
    if (!role.trim()) { Alert.alert('Required', 'Please enter the role you are preparing for.'); return; }
    setPhase('loading_q');
    setLoadingMsg('Generating smart questions for ' + role.trim() + '…');
    try {
      const qs = await generateInterviewQuestions(role.trim());
      setQuestions(qs);
      setAnswers(new Array(qs.length).fill(''));
      setCurrentQ(0);
      setPhase('interview');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not generate questions. Try again.');
      setPhase('role');
    }
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setPhase('grading');
    setLoadingMsg('Grading your interview…');
    const qaList: InterviewQA[] = questions.map((q, i) => ({ question: q, answer: answers[i] ?? '' }));
    try {
      const result = await gradeInterviewSession(role.trim(), qaList);
      setGrade(result);
      setPhase('result');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Grading failed. Please try again.');
      setPhase('interview');
    }
  };

  const setAnswer = (text: string) => {
    setAnswers(prev => { const a = [...prev]; a[currentQ] = text; return a; });
  };

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>

        {/* Header */}
        <LinearGradient colors={[C.primaryBlue, C.accentBlue]} style={st.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={st.headerTitle}>Interview Prep</Text>
          <View style={st.headerSubRow}>
            <Rocket size={13} color="rgba(255,255,255,0.8)" />
            <Text style={st.headerSub}>Smart AI mock interviews</Text>
          </View>

          <View style={st.modeToggle}>
            {(['oral', 'qa'] as Mode[]).map(m => {
              const isActive = mode === m;
              const iconColor = isActive ? C.primaryBlue : 'rgba(255,255,255,0.8)';
              return (
                <TouchableOpacity key={m} style={[st.modeBtn, isActive && st.modeBtnActive]} onPress={() => handleModeSwitch(m)}>
                  {m === 'oral'
                    ? <Mic size={14} color={iconColor} />
                    : <FileText size={14} color={iconColor} />}
                  <Text style={[st.modeBtnText, isActive && st.modeBtnTextActive]}>
                    {m === 'oral' ? 'Oral Practice' : 'Written Q&A'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </LinearGradient>

        {/* PHASE: Role Input */}
        {phase === 'role' && (
          <View style={st.section}>
            <View style={st.card}>
              <Text style={st.cardTitle}>What role are you preparing for?</Text>
              <Text style={st.cardSub}>
                The AI will generate 7 tailored interview questions — technical, behavioural, scenario, and general — just for this role.
              </Text>
              <TextInput
                style={st.input}
                value={role}
                onChangeText={setRole}
                placeholder="e.g. Software Engineering Intern"
                placeholderTextColor={C.placeholder}
                returnKeyType="done"
                onSubmitEditing={handleStart}
              />
              <View style={st.suggestions}>
                {['Software Engineer Intern', 'Data Analyst Intern', 'Product Manager Intern', 'Cybersecurity Intern', 'UI/UX Designer Intern', 'Finance Intern'].map(r => (
                  <TouchableOpacity key={r} style={[st.suggChip, role === r && st.suggChipActive]} onPress={() => setRole(r)}>
                    <Text style={[st.suggChipText, role === r && st.suggChipTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity onPress={handleStart} activeOpacity={0.85}>
              <LinearGradient colors={[C.accentBlue, C.primaryBlue]} style={st.startBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Sparkles size={16} color="#fff" />
                <Text style={st.startBtnText}>Start Interview</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={st.infoRow}>
              {[
                { label: '7 AI Questions', icon: <Zap size={12} color={C.primaryBlue} /> },
                { label: 'Role-specific', icon: <Target size={12} color={C.primaryBlue} /> },
                { label: 'Instant Grade', icon: <CheckCircle2 size={12} color={C.primaryBlue} /> },
              ].map((t, i) => (
                <View key={i} style={st.infoChip}>
                  {t.icon}
                  <Text style={st.infoChipText}>{t.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* PHASE: Loading */}
        {(phase === 'loading_q' || phase === 'grading') && (
          <View style={st.loadingBox}>
            <ActivityIndicator size="large" color={C.primaryBlue} />
            <Text style={st.loadingTitle}>{loadingMsg}</Text>
            <Text style={st.loadingSub}>
              {phase === 'loading_q' ? 'Analysing the role and crafting smart questions…' : 'Reviewing your answers and preparing detailed feedback…'}
            </Text>
          </View>
        )}

        {/* PHASE: Interview */}
        {phase === 'interview' && questions.length > 0 && (
          <View style={st.section}>
            {/* Progress */}
            <View style={st.progressRow}>
              {questions.map((_, i) => (
                <View key={i} style={[st.progressDot, i <= currentQ && st.progressDotActive, i < currentQ && st.progressDotDone]} />
              ))}
            </View>
            <Text style={st.progressLabel}>Question {currentQ + 1} of {questions.length}</Text>

            {/* Question card */}
            <View style={st.qCard}>
              <View style={[st.typeBadge, { backgroundColor: TYPE_COLOR[questions[currentQ].type] + '18' }]}>
                {TYPE_ICON[questions[currentQ].type]}
                <Text style={[st.typeText, { color: TYPE_COLOR[questions[currentQ].type] }]}>
                  {TYPE_LABEL[questions[currentQ].type]}
                </Text>
              </View>
              <Text style={st.questionText}>{questions[currentQ].question}</Text>
            </View>

            {/* Answer input */}
            <View style={st.answerBox}>
              <View style={st.answerLabelRow}>
                {mode === 'oral' ? <Mic size={14} color={C.textDark} /> : <FileText size={14} color={C.textDark} />}
                <Text style={st.answerLabel}>
                  {mode === 'oral' ? 'Speak your answer, then type a summary:' : 'Type your answer:'}
                </Text>
              </View>
              <TextInput
                style={st.answerInput}
                multiline
                numberOfLines={6}
                value={answers[currentQ]}
                onChangeText={setAnswer}
                placeholder="Type your answer here…"
                placeholderTextColor={C.placeholder}
                textAlignVertical="top"
              />
              {mode === 'oral' && (
                <View style={st.oralTip}>
                  <Lightbulb size={14} color="#92400E" />
                  <Text style={st.oralTipText}>Tip: Use the STAR method — Situation, Task, Action, Result</Text>
                </View>
              )}
            </View>

            {/* Nav buttons */}
            <View style={st.navRow}>
              {currentQ > 0 && (
                <TouchableOpacity style={st.backBtn} onPress={() => { setCurrentQ(q => q - 1); scrollRef.current?.scrollTo({ y: 0, animated: true }); }}>
                  <Text style={st.backBtnText}>Back</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[st.nextBtn, { flex: 1 }]} onPress={handleNext} activeOpacity={0.85}>
                <LinearGradient colors={[C.accentBlue, C.primaryBlue]} style={st.nextBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {currentQ === questions.length - 1
                    ? <CheckCircle2 size={16} color="#fff" />
                    : null}
                  <Text style={st.nextBtnText}>
                    {currentQ === questions.length - 1 ? 'Submit & Get Grade' : 'Next Question'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* PHASE: Result */}
        {phase === 'result' && grade && (
          <View style={st.section}>
            {/* Score card */}
            <LinearGradient
              colors={[GRADE_COLOR[grade.grade] ?? '#6366F1', GRADE_COLOR[grade.grade] ? GRADE_COLOR[grade.grade] + 'AA' : '#8B5CF6']}
              style={st.scoreCard}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Text style={st.scoreGrade}>{grade.grade}</Text>
              <Text style={st.scoreNum}>{grade.overallScore}/100</Text>
              <Text style={st.scoreRole}>{role}</Text>
            </LinearGradient>

            {/* Summary */}
            <View style={st.summaryCard}>
              <View style={st.summaryLabelRow}>
                <Layers size={14} color={C.primaryBlue} />
                <Text style={st.summaryLabel}>Overall Assessment</Text>
              </View>
              <Text style={st.summaryText}>{grade.summary}</Text>
            </View>

            {/* Strengths */}
            <View style={st.feedCard}>
              <View style={st.feedCardTitleRow}>
                <CheckCircle2 size={16} color="#16A34A" />
                <Text style={st.feedCardTitle}>Strengths</Text>
              </View>
              {grade.strengths.map((s, i) => (
                <View key={i} style={st.feedRow}>
                  <View style={[st.feedDot, { backgroundColor: '#22C55E' }]} />
                  <Text style={st.feedText}>{s}</Text>
                </View>
              ))}
            </View>

            {/* Weaknesses */}
            <View style={[st.feedCard, { borderColor: '#FCA5A530' }]}>
              <View style={st.feedCardTitleRow}>
                <AlertTriangle size={16} color="#DC2626" />
                <Text style={[st.feedCardTitle, { color: '#DC2626' }]}>Areas to Improve</Text>
              </View>
              {grade.weaknesses.map((w, i) => (
                <View key={i} style={st.feedRow}>
                  <View style={[st.feedDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={st.feedText}>{w}</Text>
                </View>
              ))}
            </View>

            {/* Per-question feedback */}
            <View style={st.perQTitleRow}>
              <FileText size={16} color={C.textDark} />
              <Text style={st.perQTitle}>Question-by-Question Feedback</Text>
            </View>
            {grade.perQuestion.map((fb, i) => {
              const q = questions.find(q => q.id === fb.questionId) ?? questions[i];
              return (
                <View key={fb.questionId} style={st.perQCard}>
                  <View style={st.perQTop}>
                    <Text style={st.perQNum}>Q{i + 1}</Text>
                    <View style={[st.perQScore, { backgroundColor: fb.score >= 7 ? '#22C55E18' : fb.score >= 4 ? '#F59E0B18' : '#EF444418' }]}>
                      <Text style={[st.perQScoreText, { color: fb.score >= 7 ? '#16A34A' : fb.score >= 4 ? '#D97706' : '#DC2626' }]}>
                        {fb.score}/10
                      </Text>
                    </View>
                  </View>
                  {q && <Text style={st.perQQuestion} numberOfLines={2}>{q.question}</Text>}
                  <Text style={st.perQFeedback}>{fb.feedback}</Text>
                  <View style={st.perQSuggBox}>
                    <View style={st.perQSuggLabelRow}>
                      <Lightbulb size={12} color="#0369A1" />
                      <Text style={st.perQSuggLabel}>Suggestion</Text>
                    </View>
                    <Text style={st.perQSuggText}>{fb.suggestion}</Text>
                  </View>
                </View>
              );
            })}

            {/* Retry */}
            <TouchableOpacity onPress={resetAll} activeOpacity={0.85}>
              <LinearGradient colors={[C.accentBlue, C.primaryBlue]} style={st.startBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <RotateCcw size={16} color="#fff" />
                <Text style={st.startBtnText}>Try Another Role</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  scroll: { flexGrow: 1 },

  header: { paddingTop: 24, paddingBottom: 32, paddingHorizontal: 20 },
  headerTitle: { fontFamily: 'DMSans_700Bold', fontSize: 26, color: '#fff', marginBottom: 4 },
  headerSubRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  headerSub: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.8)' },

  modeToggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 4 },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  modeBtnActive: { backgroundColor: '#fff' },
  modeBtnText: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  modeBtnTextActive: { color: C.primaryBlue },

  section: { padding: 20 },

  card: { backgroundColor: C.white, borderRadius: Radii.card, borderWidth: 1, borderColor: C.cardBorder, padding: 20, marginBottom: 20 },
  cardTitle: { fontFamily: 'DMSans_700Bold', fontSize: 18, color: C.textDark, marginBottom: 8 },
  cardSub: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: C.textMuted, lineHeight: 20, marginBottom: 16 },

  input: {
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.inputBorder,
    borderRadius: Radii.sm, paddingHorizontal: 14, paddingVertical: 13,
    fontFamily: 'DMSans_500Medium', fontSize: 15, color: C.textDark, marginBottom: 14,
  },

  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: C.cardBorder, backgroundColor: C.white },
  suggChipActive: { borderColor: C.primaryBlue, backgroundColor: C.lightBlue },
  suggChipText: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: C.textMuted },
  suggChipTextActive: { color: C.primaryBlue, fontFamily: 'DMSans_600SemiBold' },

  startBtn: { borderRadius: Radii.button, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  startBtnText: { fontFamily: 'DMSans_700Bold', fontSize: 16, color: '#fff' },

  infoRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 16 },
  infoChip: { backgroundColor: C.lightBlue, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5 },
  infoChipText: { fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: C.primaryBlue },

  loadingBox: { flex: 1, padding: 40, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingTitle: { fontFamily: 'DMSans_700Bold', fontSize: 18, color: C.textDark, textAlign: 'center' },
  loadingSub: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 22 },

  progressRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  progressDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: C.borderLight },
  progressDotActive: { backgroundColor: C.primaryBlue },
  progressDotDone: { backgroundColor: C.accentBlue },
  progressLabel: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: C.textMuted, marginBottom: 16 },

  qCard: { backgroundColor: C.white, borderRadius: Radii.card, borderWidth: 1, borderColor: C.cardBorder, padding: 20, marginBottom: 16 },
  typeBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 12 },
  typeText: { fontFamily: 'DMSans_600SemiBold', fontSize: 12 },
  questionText: { fontFamily: 'DMSans_700Bold', fontSize: 16, color: C.textDark, lineHeight: 26 },

  answerBox: { marginBottom: 16 },
  answerLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  answerLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: C.textDark },
  answerInput: {
    backgroundColor: C.white, borderWidth: 1.5, borderColor: C.inputBorder,
    borderRadius: Radii.card, padding: 14, fontFamily: 'DMSans_400Regular',
    fontSize: 14, color: C.textDark, minHeight: 140, lineHeight: 22,
  },
  oralTip: { backgroundColor: '#FFFBEB', borderRadius: 8, padding: 10, marginTop: 10, borderWidth: 1, borderColor: '#FDE68A', flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  oralTipText: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: '#92400E' },

  navRow: { flexDirection: 'row', gap: 12 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 15, borderRadius: Radii.button, borderWidth: 1.5, borderColor: C.borderLight, justifyContent: 'center' },
  backBtnText: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: C.textMuted },
  nextBtn: { borderRadius: Radii.button, overflow: 'hidden' },
  nextBtnGrad: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center', borderRadius: Radii.button },
  nextBtnText: { fontFamily: 'DMSans_700Bold', fontSize: 15, color: '#fff' },

  scoreCard: { borderRadius: Radii.card, padding: 32, alignItems: 'center', marginBottom: 16 },
  scoreGrade: { fontFamily: 'DMSans_700Bold', fontSize: 72, color: '#fff', lineHeight: 80 },
  scoreNum: { fontFamily: 'DMSans_700Bold', fontSize: 22, color: 'rgba(255,255,255,0.9)', marginBottom: 6 },
  scoreRole: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.75)' },

  summaryCard: { backgroundColor: C.white, borderRadius: Radii.card, borderWidth: 1, borderColor: C.cardBorder, padding: 16, marginBottom: 12 },
  summaryLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  summaryLabel: { fontFamily: 'DMSans_700Bold', fontSize: 13, color: C.textDark },
  summaryText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: C.textDark, lineHeight: 22 },

  feedCard: { backgroundColor: C.white, borderRadius: Radii.card, borderWidth: 1, borderColor: '#BBF7D030', padding: 16, marginBottom: 12 },
  feedCardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  feedCardTitle: { fontFamily: 'DMSans_700Bold', fontSize: 14, color: '#16A34A' },
  feedRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  feedDot: { width: 7, height: 7, borderRadius: 4, marginTop: 6 },
  feedText: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 13, color: C.textDark, lineHeight: 20 },

  perQTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 4 },
  perQTitle: { fontFamily: 'DMSans_700Bold', fontSize: 16, color: C.textDark },
  perQCard: { backgroundColor: C.white, borderRadius: Radii.card, borderWidth: 1, borderColor: C.cardBorder, padding: 16, marginBottom: 12 },
  perQTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  perQNum: { fontFamily: 'DMSans_700Bold', fontSize: 13, color: C.primaryBlue },
  perQScore: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  perQScoreText: { fontFamily: 'DMSans_700Bold', fontSize: 13 },
  perQQuestion: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: C.textDark, marginBottom: 8, lineHeight: 20 },
  perQFeedback: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: C.textMuted, lineHeight: 20, marginBottom: 10 },
  perQSuggBox: { backgroundColor: '#F0F9FF', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#BAE6FD' },
  perQSuggLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  perQSuggLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: '#0369A1' },
  perQSuggText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#075985', lineHeight: 18 },
});
