import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, ChevronRight, RefreshCw, Download, BookOpen, Briefcase, FolderOpen, CheckCircle } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Typography, Radii } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { generateCVWithAI, CVData, EducationEntry, ExperienceEntry, ProjectEntry } from '@/lib/nvidia';
import { EducationStep, ExperienceStep, ProjectsStep } from '@/components/CVSteps';

const C = Colors.light;

type Step = 'review' | 'role' | 'education' | 'experience' | 'projects' | 'generating' | 'result';
const STEPS: Step[] = ['review', 'role', 'education', 'experience', 'projects', 'generating', 'result'];

export default function CVBuilderScreen() {
  const { profile } = useAuthStore();
  const [step, setStep] = useState<Step>('review');
  const [targetRole, setTargetRole] = useState('');
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [version, setVersion] = useState(1);
  const [cvSaved, setCvSaved] = useState(false);
  const [educationEntries, setEducationEntries] = useState<EducationEntry[]>([]);
  const [experienceEntries, setExperienceEntries] = useState<ExperienceEntry[]>([]);
  const [projectEntries, setProjectEntries] = useState<ProjectEntry[]>([]);

  // Load any previously generated CV
  useEffect(() => {
    if (!profile?.id) return;
    supabase
      .from('generated_cvs')
      .select('cv_data, target_role, generated_at, version')
      .eq('student_id', profile.id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setCvData(data.cv_data as CVData);
          setTargetRole(data.target_role ?? '');
          setSavedAt(data.generated_at);
          setVersion((data.version ?? 1) + 1);
          setStep('result');
        }
      });
  }, [profile?.id]);

  const handleGenerate = async () => {
    if (!targetRole.trim()) {
      Alert.alert('Required', 'Please enter the role you are targeting.');
      return;
    }
    if (!profile?.id) return;

    setStep('generating');

    try {
      const ctx = {
        firstName: profile.first_name ?? '',
        lastName: profile.last_name ?? '',
        email: profile.email ?? '',
        phone: profile.phone,
        department: profile.department ?? 'Computer Science',
        level: profile.level ?? '300L',
        bio: profile.bio,
        skills: profile.skills ?? [],
        hobbies: profile.hobbies ?? [],
        gpa: profile.gpa,
        linkedinUrl: profile.linkedin_url,
        portfolioUrl: profile.portfolio_url,
        targetRole: targetRole.trim(),
        educationEntries,
        experienceEntries,
        projectEntries,
      };

      console.log('[CVBuilder] Starting generation for:', ctx.targetRole);
      const result = await generateCVWithAI(ctx);
      console.log('[CVBuilder] Generation successful');

      const now = new Date().toISOString();

      // Save to Supabase (non-fatal if table doesn't exist yet)
      const { error: dbErr } = await supabase.from('generated_cvs').upsert(
        {
          student_id: profile.id,
          cv_data: result,
          target_role: targetRole.trim(),
          generated_at: now,
          version,
          updated_at: now,
        },
        { onConflict: 'student_id' }
      );
      if (dbErr) console.warn('[CVBuilder] DB save warning:', dbErr.message);

      setCvData(result);
      setSavedAt(now);
      setStep('result');
    } catch (err: any) {
      const msg = err?.message ?? 'Unknown error. Please try again.';
      console.error('[CVBuilder] Generation error:', msg);
      Alert.alert(
        'Generation Failed',
        msg,
        [{ text: 'Try Again', onPress: () => setStep('role') }]
      );
      // Don't auto-navigate — let the user dismiss the alert first
    }
  };


  const handleRegenerate = () => {
    setVersion((v) => v + 1);
    setStep('role');
  };

  // ─── Render steps ────────────────────────────────────────────

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Header ── */}
        <LinearGradient
          colors={[C.primaryBlue, C.accentBlue]}
          style={s.headerGradient}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <View style={s.headerInner}>
            <View>
              <Text style={s.headerTitle}>AI CV Builder</Text>
              <Text style={s.headerSub}>Your profile → Professional CV in seconds</Text>
            </View>
            <View style={s.headerIcon}>
              <Sparkles size={24} color="#fff" />
            </View>
          </View>

          {/* Steps indicator */}
          <View style={s.stepsRow}>
            {STEPS.map((st, i) => (
              <View key={st} style={s.stepDot}>
                <View style={[s.dot, STEPS.indexOf(step) >= i && s.dotActive]} />
                {i < STEPS.length - 1 && <View style={s.dotLine} />}
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* ── Step: Review Profile ── */}
        {step === 'review' && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={s.sectionHeaderIcon}><Sparkles size={16} color={C.accentBlue} /></View>
              <View>
                <Text style={s.sectionHeaderTitle}>Your Profile Data</Text>
                <Text style={s.sectionHeaderSub}>This information will be used to generate your CV</Text>
              </View>
            </View>
            <View style={s.profileCard}> 
              {[
                { label: 'Full Name', value: `${profile?.first_name ?? '—'} ${profile?.last_name ?? ''}` },
                { label: 'Email', value: profile?.email ?? '—' },
                { label: 'Phone', value: profile?.phone ?? 'Not set' },
                { label: 'Department', value: profile?.department ?? 'Not set' },
                { label: 'Level', value: profile?.level ?? 'Not set' },
                { label: 'GPA', value: profile?.gpa ? String(profile.gpa) : 'Not set' },
                { label: 'LinkedIn', value: profile?.linkedin_url ?? 'Not set' },
                { label: 'Portfolio', value: profile?.portfolio_url ?? 'Not set' },
              ].map((f) => (
                <View key={f.label} style={s.profileRow}>
                  <Text style={s.profileLabel}>{f.label}</Text>
                  <Text style={[s.profileValue, f.value === 'Not set' && s.missing]} numberOfLines={1}>
                    {f.value}
                  </Text>
                </View>
              ))}
            </View>

            {profile?.bio ? (
              <View style={s.bioCard}>
                <Text style={s.bioCardLabel}>Bio</Text>
                <Text style={s.bioCardText}>{profile.bio}</Text>
              </View>
            ) : (
              <View style={[s.bioCard, s.missingCard]}>
                <Text style={s.missingCardText}>⚠️  No bio added. Go to Profile → Edit to add one for a stronger CV.</Text>
              </View>
            )}

            {(profile?.skills?.length ?? 0) > 0 && (
              <View style={s.chipsSection}>
                <Text style={s.chipsSectionLabel}>Skills on profile</Text>
                <View style={s.chips}>
                  {profile!.skills.map((sk) => (
                    <View key={sk} style={s.chip}><Text style={s.chipText}>{sk}</Text></View>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity style={s.primaryBtn} onPress={() => setStep('role')}>
              <LinearGradient colors={[C.accentBlue, C.primaryBlue]} style={s.primaryBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={s.primaryBtnText}>Looks Good — Continue</Text>
                <ChevronRight size={16} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step: Target Role ── */}
        {step === 'role' && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={s.sectionHeaderIcon}><Sparkles size={16} color={C.accentBlue} /></View>
              <View>
                <Text style={s.sectionHeaderTitle}>Target Role</Text>
                <Text style={s.sectionHeaderSub}>Tell the AI what internship you're applying for</Text>
              </View>
            </View>

            <View style={s.roleCard}>
              <Text style={s.roleInputLabel}>What role are you targeting?</Text>
              <TextInput
                style={s.roleInput}
                value={targetRole}
                onChangeText={setTargetRole}
                placeholder="e.g. Software Engineering Intern"
                placeholderTextColor={C.placeholder}
                returnKeyType="done"
              />
              <Text style={s.roleHint}>Be specific — e.g. "Frontend Developer Intern" or "Data Analyst Intern"</Text>
            </View>

            <View style={s.suggestionRow}>
              {['Software Engineer Intern', 'Data Analyst Intern', 'Product Manager Intern', 'Cybersecurity Intern'].map((r) => (
                <TouchableOpacity key={r} style={[s.suggChip, targetRole === r && s.suggChipActive]} onPress={() => setTargetRole(r)}>
                  <Text style={[s.suggChipText, targetRole === r && s.suggChipTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.btnRow}>
              <TouchableOpacity style={s.backBtn} onPress={() => setStep('review')}>
                <Text style={s.backBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.primaryBtn, { flex: 1 }]} onPress={() => {
                if (!targetRole.trim()) { Alert.alert('Required', 'Please enter the role you are targeting.'); return; }
                setStep('education');
              }}>
                <LinearGradient colors={[C.accentBlue, C.primaryBlue]} style={s.primaryBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={s.primaryBtnText}>Next: Education</Text>
                  <ChevronRight size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Step: Education ── */}
        {step === 'education' && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={s.sectionHeaderIcon}><BookOpen size={16} color={C.accentBlue} /></View>
              <View>
                <Text style={s.sectionHeaderTitle}>Education & Training</Text>
                <Text style={s.sectionHeaderSub}>University, courses, certifications, bootcamps</Text>
              </View>
            </View>
            <EducationStep entries={educationEntries} setEntries={setEducationEntries} />
            <View style={[s.btnRow, { marginTop: 16 }]}>
              <TouchableOpacity style={s.backBtn} onPress={() => setStep('role')}>
                <Text style={s.backBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.primaryBtn, { flex: 1 }]} onPress={() => setStep('experience')}>
                <LinearGradient colors={[C.accentBlue, C.primaryBlue]} style={s.primaryBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={s.primaryBtnText}>Next: Experience</Text>
                  <ChevronRight size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Step: Experience ── */}
        {step === 'experience' && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={s.sectionHeaderIcon}><Briefcase size={16} color={C.accentBlue} /></View>
              <View>
                <Text style={s.sectionHeaderTitle}>Work Experience</Text>
                <Text style={s.sectionHeaderSub}>Internships, part-time jobs, volunteering</Text>
              </View>
            </View>
            <ExperienceStep entries={experienceEntries} setEntries={setExperienceEntries} />
            <View style={[s.btnRow, { marginTop: 16 }]}>
              <TouchableOpacity style={s.backBtn} onPress={() => setStep('education')}>
                <Text style={s.backBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.primaryBtn, { flex: 1 }]} onPress={() => setStep('projects')}>
                <LinearGradient colors={[C.accentBlue, C.primaryBlue]} style={s.primaryBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={s.primaryBtnText}>Next: Projects</Text>
                  <ChevronRight size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Step: Projects ── */}
        {step === 'projects' && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={s.sectionHeaderIcon}><FolderOpen size={16} color={C.accentBlue} /></View>
              <View>
                <Text style={s.sectionHeaderTitle}>Projects</Text>
                <Text style={s.sectionHeaderSub}>Academic, personal or open-source projects</Text>
              </View>
            </View>
            <ProjectsStep entries={projectEntries} setEntries={setProjectEntries} />
            <View style={[s.btnRow, { marginTop: 16 }]}>
              <TouchableOpacity style={s.backBtn} onPress={() => setStep('experience')}>
                <Text style={s.backBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.primaryBtn, { flex: 1 }]} onPress={handleGenerate}>
                <LinearGradient colors={[C.accentBlue, C.primaryBlue]} style={s.primaryBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Sparkles size={14} color="#fff" />
                  <Text style={s.primaryBtnText}>Generate My CV</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Step: Generating ── */}
        {step === 'generating' && (
          <View style={s.generatingContainer}>
            <LinearGradient colors={[C.primaryBlue + '15', C.accentBlue + '10']} style={s.generatingCard}>
              <ActivityIndicator size="large" color={C.primaryBlue} />
              <Text style={s.generatingTitle}>AI is writing your CV…</Text>
              <Text style={s.generatingSubtitle}>Analysing your profile and crafting a role-specific CV for{'\n'}<Text style={{ color: C.primaryBlue, fontFamily: 'DMSans_700Bold' }}>{targetRole}</Text></Text>
              <View style={s.generatingSteps}>
                {['Reading your profile', 'Crafting professional summary', 'Tailoring skills & projects', 'Finalising formatting'].map((step, i) => (
                  <View key={i} style={s.genStep}>
                    <View style={s.genStepDot} />
                    <Text style={s.genStepText}>{step}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>
        )}

        {/* ── Step: Result ── */}
        {step === 'result' && cvData && (
          <View style={s.section}>

            {/* Saved banner */}
            {cvSaved && (
              <View style={s.savedBanner}>
                <CheckCircle size={16} color={C.success} />
                <Text style={s.savedBannerText}>CV saved to profile</Text>
              </View>
            )}

            <View style={s.resultBanner}>
              <Text style={s.resultBannerIcon}>✅</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.resultBannerTitle}>CV Generated!</Text>
                {savedAt && (
                  <Text style={s.resultBannerDate}>
                    {new Date(savedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </Text>
                )}
              </View>
              <TouchableOpacity style={s.regenBtn} onPress={handleRegenerate}>
                <RefreshCw size={14} color={C.accentBlue} />
                <Text style={s.regenBtnText}>Redo</Text>
              </TouchableOpacity>
            </View>

            {/* CV Document */}
            <View style={s.cvDoc}>

              {/* CV Header */}
              <View style={s.cvDocHeader}>
                <Text style={s.cvName}>{profile?.first_name} {profile?.last_name}</Text>
                <Text style={s.cvRole}>{cvData.targetRole} Intern</Text>
                <Text style={s.cvContact}>
                  {profile?.email}{profile?.phone ? `  ·  ${profile.phone}` : ''}
                </Text>
                {(profile?.linkedin_url || profile?.portfolio_url) && (
                  <Text style={s.cvContact}>
                    {profile?.linkedin_url ?? ''}{profile?.portfolio_url ? `  ·  ${profile.portfolio_url}` : ''}
                  </Text>
                )}
              </View>

              {/* Summary */}
              <CVSection title="Professional Summary" icon="📝">
                <Text style={s.cvBodyText}>{cvData.summary}</Text>
              </CVSection>

              {/* Education */}
              <CVSection title="Education" icon="🎓">
                {cvData.education.map((edu, i) => (
                  <View key={i} style={s.cvEntry}>
                    <View style={s.cvEntryHeader}>
                      <Text style={s.cvEntryTitle}>{edu.institution}</Text>
                      <Text style={s.cvEntryDate}>{edu.period}</Text>
                    </View>
                    <Text style={s.cvEntrySub}>{edu.degree}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}</Text>
                  </View>
                ))}
              </CVSection>

              {/* Skills */}
              <CVSection title="Skills" icon="🏅">
                {cvData.skills.map((group, i) => (
                  <View key={i} style={s.skillGroup}>
                    <Text style={s.skillGroupLabel}>{group.category}:</Text>
                    <Text style={s.cvBodyText}>{group.items.join(', ')}</Text>
                  </View>
                ))}
              </CVSection>

              {/* Projects */}
              <CVSection title="Projects" icon="⟨⟩">
                {cvData.projects.map((proj, i) => (
                  <View key={i} style={s.cvEntry}>
                    <View style={s.cvEntryHeader}>
                      <Text style={s.cvEntryTitle}>{proj.title}</Text>
                    </View>
                    <Text style={s.cvBodyText}>{proj.description}</Text>
                    <View style={s.techRow}>
                      {proj.technologies.map((t) => (
                        <View key={t} style={s.techChip}><Text style={s.techChipText}>{t}</Text></View>
                      ))}
                    </View>
                  </View>
                ))}
              </CVSection>

              {/* Experience */}
              {cvData.experience && cvData.experience.length > 0 && (
                <CVSection title="Work Experience" icon="💼">
                  {cvData.experience.map((exp, i) => (
                    <View key={i} style={s.cvEntry}>
                      <View style={s.cvEntryHeader}>
                        <Text style={s.cvEntryTitle}>{exp.role} — {exp.company}</Text>
                        <Text style={s.cvEntryDate}>{exp.period}</Text>
                      </View>
                      {exp.description ? <Text style={s.cvBodyText}>{exp.description}</Text> : null}
                    </View>
                  ))}
                </CVSection>
              )}

              {/* Hobbies */}
              <CVSection title="Hobbies & Interests" icon="🎯">
                <Text style={s.cvBodyText}>{cvData.hobbies.join('  ·  ')}</Text>
              </CVSection>
            </View>

            {/* Actions */}
            <View style={s.actionRow}>
              <TouchableOpacity
                style={s.actionBtn}
                onPress={async () => {
                  if (!profile?.id || !cvData) return;
                  const now = new Date().toISOString();
                  const { error } = await supabase.from('generated_cvs').upsert(
                    { student_id: profile.id, cv_data: cvData, target_role: cvData.targetRole, generated_at: now, version, updated_at: now },
                    { onConflict: 'student_id' }
                  );
                  if (!error) { setCvSaved(true); setTimeout(() => setCvSaved(false), 4000); }
                  else Alert.alert('Save failed', error.message);
                }}
              >
                <CheckCircle size={16} color={C.primaryBlue} />
                <Text style={s.actionBtnText}>Save CV</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, s.actionBtnSolid]} onPress={() => Alert.alert('Coming soon', 'PDF download will be available soon.')}>
                <Download size={16} color="#fff" />
                <Text style={[s.actionBtnText, { color: '#fff' }]}>Download PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function CVSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <View style={s.cvSection}>
      <View style={s.cvSectionHeader}>
        <View style={s.cvSectionBar} />
        <Text style={s.cvSectionTitle}>{icon}  {title}</Text>
      </View>
      <View style={s.cvSectionBody}>{children}</View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  scroll: { flexGrow: 1 },

  // Header
  headerGradient: { paddingTop: 20, paddingBottom: 28, paddingHorizontal: 20 },
  headerInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontFamily: 'Fraunces_700Bold', fontSize: 24, color: '#fff' },
  headerSub: { ...Typography.label, color: 'rgba(255,255,255,0.75)', marginTop: 3 },
  headerIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  stepsRow: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { backgroundColor: '#fff' },
  dotLine: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 4 },

  // Sections
  section: { padding: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  sectionHeaderIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.lightBlue, justifyContent: 'center', alignItems: 'center' },
  sectionHeaderTitle: { fontFamily: 'DMSans_700Bold', fontSize: 16, color: C.textDark },
  sectionHeaderSub: { ...Typography.micro, color: C.textMuted, marginTop: 2 },

  // Profile review
  profileCard: { backgroundColor: C.white, borderRadius: Radii.card, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 12, overflow: 'hidden' },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  profileLabel: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: C.textMuted },
  profileValue: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: C.textDark, maxWidth: '55%', textAlign: 'right' },
  missing: { color: C.textMuted, fontStyle: 'italic', fontFamily: 'DMSans_400Regular' },
  bioCard: { backgroundColor: C.white, borderRadius: Radii.card, borderWidth: 1, borderColor: C.cardBorder, padding: 14, marginBottom: 12 },
  bioCardLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  bioCardText: { ...Typography.body, color: C.textDark, lineHeight: 22 },
  missingCard: { backgroundColor: '#FFF8E1', borderColor: '#F59E0B30' },
  missingCardText: { ...Typography.body, color: '#92400E' },
  chipsSection: { marginBottom: 16 },
  chipsSectionLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: C.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: C.lightBlue, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  chipText: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: C.primaryBlue },

  // Buttons
  primaryBtn: { borderRadius: Radii.button, overflow: 'hidden' },
  primaryBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, paddingHorizontal: 20, borderRadius: Radii.button },
  primaryBtnText: { fontFamily: 'DMSans_700Bold', fontSize: 15, color: '#fff' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 15, borderRadius: Radii.button, borderWidth: 1.5, borderColor: C.borderLight, justifyContent: 'center' },
  backBtnText: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: C.textMuted },

  // Role step
  roleCard: { backgroundColor: C.white, borderRadius: Radii.card, borderWidth: 1, borderColor: C.cardBorder, padding: 16, marginBottom: 16 },
  roleInputLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: C.textDark, marginBottom: 10 },
  roleInput: { backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.inputBorder, borderRadius: Radii.sm, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'DMSans_500Medium', fontSize: 15, color: C.textDark, marginBottom: 8 },
  roleHint: { ...Typography.micro, color: C.textMuted, lineHeight: 18 },
  suggestionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  suggChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: C.cardBorder, backgroundColor: C.white },
  suggChipActive: { borderColor: C.primaryBlue, backgroundColor: C.lightBlue },
  suggChipText: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: C.textMuted },
  suggChipTextActive: { color: C.primaryBlue, fontFamily: 'DMSans_600SemiBold' },

  // Generating
  generatingContainer: { padding: 20, flex: 1 },
  generatingCard: { borderRadius: Radii.card, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: C.cardBorder },
  generatingTitle: { fontFamily: 'Fraunces_700Bold', fontSize: 22, color: C.textDark, marginTop: 20, marginBottom: 8 },
  generatingSubtitle: { ...Typography.body, color: C.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  generatingSteps: { width: '100%', gap: 12 },
  genStep: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  genStepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accentBlue },
  genStepText: { ...Typography.body, color: C.textMuted },

  // Result banner
  resultBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.success + '12', borderRadius: Radii.card, borderWidth: 1, borderColor: C.success + '30', padding: 14, marginBottom: 16 },
  resultBannerIcon: { fontSize: 24 },
  resultBannerTitle: { fontFamily: 'DMSans_700Bold', fontSize: 15, color: C.success },
  resultBannerDate: { ...Typography.micro, color: C.textMuted, marginTop: 2 },
  regenBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: C.accentBlue },
  regenBtnText: { fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: C.accentBlue },
  savedBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.success + '15', borderRadius: Radii.md, borderWidth: 1, borderColor: C.success + '40', padding: 12, marginBottom: 12 },
  savedBannerText: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: C.success },

  // CV Document
  cvDoc: { backgroundColor: C.white, borderRadius: Radii.card, borderWidth: 1, borderColor: C.cardBorder, overflow: 'hidden', marginBottom: 16 },
  cvDocHeader: { backgroundColor: C.primaryBlue, padding: 20, paddingBottom: 18 },
  cvName: { fontFamily: 'DMSans_700Bold', fontSize: 20, color: '#fff' },
  cvRole: { ...Typography.body, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  cvContact: { ...Typography.micro, color: 'rgba(255,255,255,0.65)', marginTop: 4 },

  cvSection: { borderTopWidth: 1, borderTopColor: C.borderLight },
  cvSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  cvSectionBar: { width: 3, height: 16, borderRadius: 2, backgroundColor: C.accentBlue },
  cvSectionTitle: { fontFamily: 'DMSans_700Bold', fontSize: 13, color: C.primaryBlue, textTransform: 'uppercase', letterSpacing: 0.5 },
  cvSectionBody: { paddingHorizontal: 16, paddingBottom: 14, gap: 10 },

  cvEntry: { gap: 4 },
  cvEntryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cvEntryTitle: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: C.textDark, flex: 1 },
  cvEntryDate: { fontFamily: 'DMSans_500Medium', fontSize: 11, color: C.textMuted },
  cvEntrySub: { ...Typography.body, color: C.textMuted },
  cvBodyText: { ...Typography.body, color: C.textDark, lineHeight: 20 },

  skillGroup: { gap: 2 },
  skillGroupLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: C.textDark },

  techRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  techChip: { backgroundColor: C.lightBlue, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  techChipText: { fontFamily: 'DMSans_500Medium', fontSize: 10, color: C.primaryBlue },

  // Actions
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: Radii.button, borderWidth: 1.5, borderColor: C.primaryBlue },
  actionBtnSolid: { backgroundColor: C.primaryBlue, borderColor: C.primaryBlue },
  actionBtnText: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: C.primaryBlue },
});
