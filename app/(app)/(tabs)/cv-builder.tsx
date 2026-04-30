import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Typography, Radii } from '@/constants/theme';
import { SKILLS_LIST } from '@/constants/AppData';
import { useAuthStore } from '@/store/authStore';

const TEMPLATES = [
  { id: '1', name: 'Modern Professional', price: 15500, tag: 'ATS-Optimized', recommended: true, emoji: '📄' },
  { id: '2', name: 'Creative Portfolio', price: 12000, tag: 'Creative', recommended: false, emoji: '🎨' },
  { id: '3', name: 'Clean Classic', price: 8000, tag: 'Professional', recommended: false, emoji: '📋' },
  { id: '4', name: 'Tech Focused', price: 10000, tag: 'Modern', recommended: false, emoji: '💻' },
];

const STEPS = ['Profile', 'Skills', 'Target Role', 'Preferences'];

export default function CVBuilderScreen() {
  const { profile } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState('1');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [targetRole, setTargetRole] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 2500));
    setIsGenerating(false);
    setGenerated(true);
  };

  const formatNaira = (n: number) => `₦${n.toLocaleString('en-NG')}`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>CV Builder</Text>
          <Text style={styles.headerSub}>Build a CV that gets you hired</Text>
        </View>

        {/* Templates Section */}
        <Text style={styles.sectionTitle}>Choose Template</Text>

        {/* Recommended */}
        {TEMPLATES.filter((t) => t.recommended).map((t) => (
          <View key={t.id} style={styles.recommendedCard}>
            <LinearGradient
              colors={[Colors.light.primaryBlue, Colors.light.accentBlue]}
              style={styles.recommendedGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <View style={styles.recommendedTop}>
                <View>
                  <View style={styles.recTag}>
                    <Text style={styles.recTagText}>⭐ Recommended</Text>
                  </View>
                  <Text style={styles.recTemplateName}>{t.name}</Text>
                  <Text style={styles.recTemplateTag}>{t.tag}</Text>
                </View>
                <Text style={{ fontSize: 64 }}>{t.emoji}</Text>
              </View>
              <View style={styles.recFooter}>
                <Text style={styles.recPrice}>{formatNaira(t.price)}</Text>
                <View style={styles.recBtnRow}>
                  <TouchableOpacity style={styles.recPreviewBtn}>
                    <Text style={styles.recPreviewText}>Preview</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.recUseBtn}>
                    <Text style={styles.recUseText}>Use Template</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>
        ))}

        {/* Other Templates Grid */}
        <View style={styles.templatesGrid}>
          {TEMPLATES.filter((t) => !t.recommended).map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.templateCard, selectedTemplate === t.id && styles.templateCardSelected]}
              onPress={() => setSelectedTemplate(t.id)}
            >
              <Text style={styles.templateEmoji}>{t.emoji}</Text>
              <Text style={styles.templateName}>{t.name}</Text>
              <Text style={styles.templateTag}>{t.tag}</Text>
              <Text style={styles.templatePrice}>{formatNaira(t.price)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* AI Generation Section */}
        <View style={styles.aiSection}>
          <Text style={styles.sectionTitle}>AI CV Generator</Text>
          <Text style={styles.aiSubtitle}>
            Let AI build a personalized CV from your academic profile
          </Text>

          {/* Step Indicator */}
          <View style={styles.stepRow}>
            {STEPS.map((step, i) => (
              <React.Fragment key={step}>
                <TouchableOpacity
                  style={[styles.stepDot, i <= currentStep && styles.stepDotActive]}
                  onPress={() => setCurrentStep(i)}
                >
                  <Text style={[styles.stepDotText, i <= currentStep && styles.stepDotTextActive]}>
                    {i + 1}
                  </Text>
                </TouchableOpacity>
                {i < STEPS.length - 1 && (
                  <View style={[styles.stepLine, i < currentStep && styles.stepLineActive]} />
                )}
              </React.Fragment>
            ))}
          </View>
          <Text style={styles.stepLabel}>{STEPS[currentStep]}</Text>

          {/* Step Content */}
          {currentStep === 0 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepContentTitle}>Profile Auto-filled</Text>
              {[
                { label: 'Full Name', value: `${profile?.first_name ?? 'Adebayo'} ${profile?.last_name ?? 'Okafor'}` },
                { label: 'Department', value: profile?.department ?? 'Computer Science' },
                { label: 'Level', value: profile?.level ?? '300L' },
                { label: 'Matric Number', value: profile?.matric_number ?? 'RUN/CPS/22/00123' },
              ].map((field) => (
                <View key={field.label} style={styles.profileField}>
                  <Text style={styles.profileFieldLabel}>{field.label}</Text>
                  <Text style={styles.profileFieldValue}>{field.value}</Text>
                </View>
              ))}
            </View>
          )}

          {currentStep === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepContentTitle}>Select Your Skills</Text>
              <View style={styles.skillsGrid}>
                {SKILLS_LIST.slice(0, 20).map((skill) => (
                  <TouchableOpacity
                    key={skill}
                    style={[styles.skillChip, selectedSkills.includes(skill) && styles.skillChipActive]}
                    onPress={() => toggleSkill(skill)}
                  >
                    <Text style={[styles.skillChipText, selectedSkills.includes(skill) && styles.skillChipTextActive]}>
                      {skill}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {currentStep === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepContentTitle}>Target Role</Text>
              <Text style={styles.stepContentSub}>What kind of internship are you applying for?</Text>
              {['Software Developer', 'UI/UX Designer', 'Data Analyst', 'Marketing Intern', 'Accountant', 'Engineer'].map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[styles.roleOption, targetRole === role && styles.roleOptionActive]}
                  onPress={() => setTargetRole(role)}
                >
                  <Text style={[styles.roleOptionText, targetRole === role && styles.roleOptionTextActive]}>
                    {role}
                  </Text>
                  {targetRole === role && <Text style={styles.roleCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {currentStep === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepContentTitle}>Your Preferences</Text>
              {[
                { label: 'Work Type', options: ['Remote', 'Onsite', 'Hybrid'] },
                { label: 'Location', options: ['Lagos', 'Abuja', 'Remote', 'Anywhere'] },
              ].map((group) => (
                <View key={group.label} style={styles.prefGroup}>
                  <Text style={styles.prefGroupLabel}>{group.label}</Text>
                  <View style={styles.prefOptions}>
                    {group.options.map((opt) => (
                      <TouchableOpacity key={opt} style={styles.prefChip}>
                        <Text style={styles.prefChipText}>{opt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Navigation */}
          <View style={styles.stepNav}>
            {currentStep > 0 && (
              <TouchableOpacity style={styles.prevBtn} onPress={() => setCurrentStep((s) => s - 1)}>
                <Text style={styles.prevBtnText}>← Back</Text>
              </TouchableOpacity>
            )}
            {currentStep < STEPS.length - 1 ? (
              <TouchableOpacity style={styles.nextStepBtn} onPress={() => setCurrentStep((s) => s + 1)}>
                <LinearGradient
                  colors={[Colors.light.accentBlue, Colors.light.primaryBlue]}
                  style={styles.nextStepGradient}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.nextStepText}>Next →</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.generateBtn}
                onPress={handleGenerate}
                disabled={isGenerating}
              >
                <LinearGradient
                  colors={[Colors.light.accentBlue, Colors.light.primaryBlue]}
                  style={styles.generateGradient}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.generateText}>
                    {isGenerating ? '✨ Generating...' : '✨ Generate My CV'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Generated CV Preview */}
          {generated && (
            <View style={styles.cvPreview}>
              <View style={styles.cvPreviewHeader}>
                <Text style={styles.cvPreviewSuccess}>✅ CV Generated!</Text>
              </View>
              <View style={styles.cvMock}>
                <View style={styles.cvMockHeader}>
                  <Text style={styles.cvMockName}>{profile?.first_name ?? 'Adebayo'} {profile?.last_name ?? 'Okafor'}</Text>
                  <Text style={styles.cvMockTitle}>{targetRole || 'Software Developer'} Intern</Text>
                </View>
                {['Education', 'Skills', 'Projects', 'References'].map((section) => (
                  <View key={section} style={styles.cvMockSection}>
                    <View style={styles.cvMockSectionBar} />
                    <Text style={styles.cvMockSectionTitle}>{section}</Text>
                    <View style={styles.cvMockLine} />
                    <View style={[styles.cvMockLine, { width: '70%' }]} />
                  </View>
                ))}
              </View>
              <View style={styles.cvActions}>
                <TouchableOpacity style={styles.downloadBtn}>
                  <Text style={styles.downloadBtnText}>📥 Download PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.useForAppBtn}>
                  <Text style={styles.useForAppBtnText}>Use for Application</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  scroll: { flexGrow: 1 },
  header: {
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.light.border,
  },
  headerTitle: { fontFamily: 'DMSans_700Bold', fontSize: 22, color: Colors.light.textDark },
  headerSub: { ...Typography.label, color: Colors.light.textMuted, marginTop: 2 },
  sectionTitle: {
    fontFamily: 'DMSans_600SemiBold', fontSize: 17, color: Colors.light.textDark,
    paddingHorizontal: 20, marginTop: 24, marginBottom: 14,
  },
  recommendedCard: { marginHorizontal: 20, borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
  recommendedGradient: { padding: 22 },
  recommendedTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  recTag: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4, marginBottom: 8, alignSelf: 'flex-start',
  },
  recTagText: { fontFamily: 'DMSans_600SemiBold', fontSize: 11, color: '#FFFFFF' },
  recTemplateName: { fontFamily: 'DMSans_700Bold', fontSize: 18, color: '#FFFFFF', marginBottom: 4 },
  recTemplateTag: { ...Typography.label, color: 'rgba(255,255,255,0.75)' },
  recFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recPrice: { fontFamily: 'DMSans_700Bold', fontSize: 18, color: '#FFFFFF' },
  recBtnRow: { flexDirection: 'row', gap: 10 },
  recPreviewBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
  },
  recPreviewText: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#FFFFFF' },
  recUseBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  recUseText: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.light.primaryBlue },
  templatesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20, marginBottom: 8 },
  templateCard: {
    width: '47%', backgroundColor: Colors.light.white,
    borderRadius: Radii.card, padding: 16, alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.light.cardBorder,
  },
  templateCardSelected: { borderColor: Colors.light.accentBlue, backgroundColor: Colors.light.lightBlue },
  templateEmoji: { fontSize: 36, marginBottom: 8 },
  templateName: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.light.textDark, marginBottom: 4, textAlign: 'center' },
  templateTag: { ...Typography.micro, color: Colors.light.textMuted, marginBottom: 8 },
  templatePrice: { fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.light.primaryBlue },
  aiSection: { borderTopWidth: 1, borderTopColor: Colors.light.borderLight, paddingTop: 8 },
  aiSubtitle: { ...Typography.body, color: Colors.light.textMuted, paddingHorizontal: 20, marginBottom: 24 },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 8 },
  stepDot: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.light.border,
    justifyContent: 'center', alignItems: 'center',
  },
  stepDotActive: { backgroundColor: Colors.light.primaryBlue },
  stepDotText: { fontFamily: 'DMSans_700Bold', fontSize: 13, color: Colors.light.textMuted },
  stepDotTextActive: { color: '#FFFFFF' },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.light.border },
  stepLineActive: { backgroundColor: Colors.light.primaryBlue },
  stepLabel: { ...Typography.labelSemiBold, color: Colors.light.textMuted, paddingHorizontal: 20, marginBottom: 20 },
  stepContent: {
    marginHorizontal: 20, backgroundColor: Colors.light.surfaceGrey,
    borderRadius: Radii.card, padding: 16, marginBottom: 20,
  },
  stepContentTitle: { fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.light.textDark, marginBottom: 16 },
  stepContentSub: { ...Typography.body, color: Colors.light.textMuted, marginBottom: 14 },
  profileField: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.light.borderLight,
  },
  profileFieldLabel: { ...Typography.label, color: Colors.light.textMuted },
  profileFieldValue: { ...Typography.bodyMedium, color: Colors.light.textDark },
  skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50,
    borderWidth: 1, borderColor: Colors.light.border, backgroundColor: Colors.light.white,
  },
  skillChipActive: { backgroundColor: Colors.light.primaryBlue, borderColor: Colors.light.primaryBlue },
  skillChipText: { ...Typography.micro, color: Colors.light.textDark },
  skillChipTextActive: { color: '#FFFFFF' },
  roleOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.light.border,
    backgroundColor: Colors.light.white, marginBottom: 8,
  },
  roleOptionActive: { borderColor: Colors.light.primaryBlue, backgroundColor: Colors.light.lightBlue },
  roleOptionText: { ...Typography.body, color: Colors.light.textDark },
  roleOptionTextActive: { fontFamily: 'DMSans_600SemiBold', color: Colors.light.primaryBlue },
  roleCheck: { color: Colors.light.success, fontSize: 16 },
  prefGroup: { marginBottom: 16 },
  prefGroupLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.light.textDark, marginBottom: 8 },
  prefOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  prefChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 50,
    borderWidth: 1, borderColor: Colors.light.border, backgroundColor: Colors.light.white,
  },
  prefChipText: { ...Typography.label, color: Colors.light.textDark },
  stepNav: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 24, justifyContent: 'flex-end' },
  prevBtn: {
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: Radii.button, borderWidth: 1.5, borderColor: Colors.light.border,
  },
  prevBtnText: { ...Typography.button, color: Colors.light.textMuted },
  nextStepBtn: { flex: 1, borderRadius: Radii.button, overflow: 'hidden' },
  nextStepGradient: { paddingVertical: 14, alignItems: 'center', borderRadius: Radii.button },
  nextStepText: { ...Typography.button, color: '#FFFFFF' },
  generateBtn: { flex: 1, borderRadius: Radii.button, overflow: 'hidden' },
  generateGradient: { paddingVertical: 14, alignItems: 'center', borderRadius: Radii.button },
  generateText: { ...Typography.button, color: '#FFFFFF' },
  cvPreview: { marginHorizontal: 20, borderRadius: Radii.card, overflow: 'hidden', marginBottom: 16 },
  cvPreviewHeader: {
    backgroundColor: Colors.light.success + '15', paddingVertical: 12, alignItems: 'center',
    borderTopLeftRadius: Radii.card, borderTopRightRadius: Radii.card,
  },
  cvPreviewSuccess: { fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.light.success },
  cvMock: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: Colors.light.cardBorder,
    padding: 20,
  },
  cvMockHeader: { borderBottomWidth: 2, borderBottomColor: Colors.light.primaryBlue, paddingBottom: 12, marginBottom: 16 },
  cvMockName: { fontFamily: 'DMSans_700Bold', fontSize: 18, color: Colors.light.textDark },
  cvMockTitle: { ...Typography.body, color: Colors.light.accentBlue },
  cvMockSection: { marginBottom: 14 },
  cvMockSectionBar: { width: 3, height: 14, backgroundColor: Colors.light.accentBlue, position: 'absolute', left: 0 },
  cvMockSectionTitle: { fontFamily: 'DMSans_700Bold', fontSize: 13, color: Colors.light.primaryBlue, marginLeft: 10, marginBottom: 8 },
  cvMockLine: { height: 6, width: '90%', backgroundColor: Colors.light.borderLight, borderRadius: 3, marginBottom: 5, marginLeft: 10 },
  cvActions: { flexDirection: 'row', gap: 10, padding: 14, backgroundColor: Colors.light.surfaceGrey, borderBottomLeftRadius: Radii.card, borderBottomRightRadius: Radii.card },
  downloadBtn: {
    flex: 1, paddingVertical: 12, borderRadius: Radii.button, alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.light.primaryBlue,
  },
  downloadBtnText: { ...Typography.button, color: Colors.light.primaryBlue, fontSize: 13 },
  useForAppBtn: { flex: 1, paddingVertical: 12, borderRadius: Radii.button, alignItems: 'center', backgroundColor: Colors.light.primaryBlue },
  useForAppBtnText: { ...Typography.button, color: '#FFFFFF', fontSize: 13 },
});
