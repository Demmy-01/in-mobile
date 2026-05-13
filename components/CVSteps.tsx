import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Plus, Trash2 } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Radii, Typography } from '@/constants/theme';
import { EducationEntry, ExperienceEntry, ProjectEntry } from '@/lib/nvidia';

const C = Colors.light;

// ── Shared ────────────────────────────────────────────────────

function Label({ text }: { text: string }) {
  return <Text style={s.label}>{text}</Text>;
}

function Field({ placeholder, value, onChangeText, multiline }: {
  placeholder: string; value: string;
  onChangeText: (v: string) => void; multiline?: boolean;
}) {
  return (
    <TextInput
      style={[s.input, multiline && s.textarea]}
      placeholder={placeholder}
      placeholderTextColor={C.placeholder}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
      textAlignVertical={multiline ? 'top' : 'center'}
    />
  );
}

// ── Education Step ────────────────────────────────────────────

export interface EducationDraft {
  inst: string;
  deg: string;
  period: string;
}

export function EducationStep({
  entries, setEntries, draft, setDraft,
}: {
  entries: EducationEntry[];
  setEntries: (e: EducationEntry[]) => void;
  draft: EducationDraft;
  setDraft: (d: EducationDraft) => void;
}) {
  const add = () => {
    if (!draft.inst.trim() || !draft.deg.trim()) return;
    setEntries([...entries, {
      institution: draft.inst.trim(),
      degree: draft.deg.trim(),
      period: draft.period.trim(),
    }]);
    setDraft({ inst: '', deg: '', period: '' });
  };

  const hasDraftContent = draft.inst.trim() || draft.deg.trim();

  return (
    <View>
      <Text style={s.hint}>Add your university, courses, certifications or training programmes.</Text>

      {entries.map((e, i) => (
        <View key={i} style={s.entryCard}>
          <View style={{ flex: 1 }}>
            <Text style={s.entryTitle}>{e.institution}</Text>
            <Text style={s.entrySub}>{e.degree}{e.period ? `  ·  ${e.period}` : ''}</Text>
          </View>
          <TouchableOpacity onPress={() => setEntries(entries.filter((_, j) => j !== i))}>
            <Trash2 size={16} color={C.error} />
          </TouchableOpacity>
        </View>
      ))}

      {hasDraftContent && (
        <View style={s.draftWarning}>
          <Text style={s.draftWarningText}>⚠️  Press "Add Entry" below to save this before continuing</Text>
        </View>
      )}

      <View style={s.formCard}>
        <Label text="Institution / Programme" />
        <Field placeholder="e.g. Redeemer's University or Udemy" value={draft.inst} onChangeText={(v) => setDraft({ ...draft, inst: v })} />
        <Label text="Degree / Course / Certificate" />
        <Field placeholder="e.g. B.Sc. Computer Science or React Native Bootcamp" value={draft.deg} onChangeText={(v) => setDraft({ ...draft, deg: v })} />
        <Label text="Period (optional)" />
        <Field placeholder="e.g. 2021 – Present" value={draft.period} onChangeText={(v) => setDraft({ ...draft, period: v })} />
        <TouchableOpacity style={s.addBtn} onPress={add}>
          <Plus size={16} color="#fff" />
          <Text style={s.addBtnText}>Add Entry</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Experience Step ───────────────────────────────────────────

export interface ExperienceDraft {
  company: string;
  role: string;
  period: string;
  desc: string;
}

export function ExperienceStep({
  entries, setEntries, draft, setDraft,
}: {
  entries: ExperienceEntry[];
  setEntries: (e: ExperienceEntry[]) => void;
  draft: ExperienceDraft;
  setDraft: (d: ExperienceDraft) => void;
}) {
  const add = () => {
    if (!draft.company.trim() || !draft.role.trim()) return;
    setEntries([...entries, {
      company: draft.company.trim(),
      role: draft.role.trim(),
      period: draft.period.trim(),
      description: draft.desc.trim(),
    }]);
    setDraft({ company: '', role: '', period: '', desc: '' });
  };

  const hasDraftContent = draft.company.trim() || draft.role.trim();

  return (
    <View>
      <Text style={s.hint}>Add internships, part-time jobs, volunteering, or any relevant experience.</Text>

      {entries.map((e, i) => (
        <View key={i} style={s.entryCard}>
          <View style={{ flex: 1 }}>
            <Text style={s.entryTitle}>{e.role} — {e.company}</Text>
            <Text style={s.entrySub}>{e.period}</Text>
            {e.description ? <Text style={s.entryDesc} numberOfLines={2}>{e.description}</Text> : null}
          </View>
          <TouchableOpacity onPress={() => setEntries(entries.filter((_, j) => j !== i))}>
            <Trash2 size={16} color={C.error} />
          </TouchableOpacity>
        </View>
      ))}

      {hasDraftContent && (
        <View style={s.draftWarning}>
          <Text style={s.draftWarningText}>⚠️  Press "Add Experience" below to save this before continuing</Text>
        </View>
      )}

      <View style={s.formCard}>
        <Label text="Company / Organisation" />
        <Field placeholder="e.g. Access Bank or NITDA" value={draft.company} onChangeText={(v) => setDraft({ ...draft, company: v })} />
        <Label text="Role / Position" />
        <Field placeholder="e.g. Software Intern" value={draft.role} onChangeText={(v) => setDraft({ ...draft, role: v })} />
        <Label text="Period (optional)" />
        <Field placeholder="e.g. Jun 2023 – Aug 2023" value={draft.period} onChangeText={(v) => setDraft({ ...draft, period: v })} />
        <Label text="What did you do? (optional)" />
        <Field placeholder="Briefly describe your responsibilities and achievements…" value={draft.desc} onChangeText={(v) => setDraft({ ...draft, desc: v })} multiline />
        <TouchableOpacity style={s.addBtn} onPress={add}>
          <Plus size={16} color="#fff" />
          <Text style={s.addBtnText}>Add Experience</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Projects Step ─────────────────────────────────────────────

export interface ProjectDraft {
  title: string;
  desc: string;
  tech: string;
}

export function ProjectsStep({
  entries, setEntries, draft, setDraft,
}: {
  entries: ProjectEntry[];
  setEntries: (e: ProjectEntry[]) => void;
  draft: ProjectDraft;
  setDraft: (d: ProjectDraft) => void;
}) {
  const add = () => {
    if (!draft.title.trim()) return;
    setEntries([...entries, {
      title: draft.title.trim(),
      description: draft.desc.trim(),
      technologies: draft.tech.trim(),
    }]);
    setDraft({ title: '', desc: '', tech: '' });
  };

  const hasDraftContent = draft.title.trim();

  return (
    <View>
      <Text style={s.hint}>Add academic, personal or open-source projects. If you skip this, the AI will suggest relevant ones.</Text>

      {entries.map((e, i) => (
        <View key={i} style={s.entryCard}>
          <View style={{ flex: 1 }}>
            <Text style={s.entryTitle}>{e.title}</Text>
            {e.description ? <Text style={s.entrySub} numberOfLines={2}>{e.description}</Text> : null}
            {e.technologies ? <Text style={s.techText}>{e.technologies}</Text> : null}
          </View>
          <TouchableOpacity onPress={() => setEntries(entries.filter((_, j) => j !== i))}>
            <Trash2 size={16} color={C.error} />
          </TouchableOpacity>
        </View>
      ))}

      {hasDraftContent && (
        <View style={s.draftWarning}>
          <Text style={s.draftWarningText}>⚠️  Press "Add Project" below to save this before continuing</Text>
        </View>
      )}

      <View style={s.formCard}>
        <Label text="Project Name" />
        <Field placeholder="e.g. Student Portal App" value={draft.title} onChangeText={(v) => setDraft({ ...draft, title: v })} />
        <Label text="Description (optional)" />
        <Field placeholder="What does it do? What problem does it solve?" value={draft.desc} onChangeText={(v) => setDraft({ ...draft, desc: v })} multiline />
        <Label text="Technologies Used (optional)" />
        <Field placeholder="e.g. React Native, Supabase, TypeScript" value={draft.tech} onChangeText={(v) => setDraft({ ...draft, tech: v })} />
        <TouchableOpacity style={s.addBtn} onPress={add}>
          <Plus size={16} color="#fff" />
          <Text style={s.addBtnText}>Add Project</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
  hint: { ...Typography.body, color: C.textMuted, marginBottom: 14, lineHeight: 21 },
  entryCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: C.white, borderRadius: Radii.md, padding: 14,
    borderWidth: 1, borderColor: C.cardBorder, marginBottom: 10,
  },
  entryTitle: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: C.textDark },
  entrySub: { ...Typography.micro, color: C.textMuted, marginTop: 2 },
  entryDesc: { ...Typography.micro, color: C.textMuted, marginTop: 4 },
  techText: { fontFamily: 'DMSans_500Medium', fontSize: 11, color: C.accentBlue, marginTop: 4 },
  draftWarning: {
    backgroundColor: '#FFF3CD', borderRadius: Radii.sm, borderWidth: 1,
    borderColor: '#F59E0B50', padding: 10, marginBottom: 10,
  },
  draftWarningText: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: '#92400E' },
  formCard: {
    backgroundColor: C.surfaceGrey, borderRadius: Radii.card,
    borderWidth: 1, borderColor: C.borderLight, padding: 14, gap: 4,
  },
  label: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: C.textMuted, marginTop: 10, marginBottom: 4 },
  input: {
    backgroundColor: C.white, borderWidth: 1, borderColor: C.inputBorder,
    borderRadius: Radii.sm, paddingHorizontal: 12, paddingVertical: 10,
    fontFamily: 'DMSans_400Regular', fontSize: 14, color: C.textDark,
  },
  textarea: { minHeight: 80, paddingTop: 10 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: C.accentBlue, borderRadius: Radii.button,
    paddingVertical: 12, marginTop: 14,
  },
  addBtnText: { fontFamily: 'DMSans_700Bold', fontSize: 14, color: '#fff' },
});
