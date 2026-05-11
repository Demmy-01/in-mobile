import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
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

export function EducationStep({
  entries, setEntries,
}: { entries: EducationEntry[]; setEntries: (e: EducationEntry[]) => void }) {
  const [inst, setInst] = useState('');
  const [deg, setDeg] = useState('');
  const [period, setPeriod] = useState('');

  const add = () => {
    if (!inst.trim() || !deg.trim()) return;
    setEntries([...entries, { institution: inst.trim(), degree: deg.trim(), period: period.trim() }]);
    setInst(''); setDeg(''); setPeriod('');
  };

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

      <View style={s.formCard}>
        <Label text="Institution / Programme" />
        <Field placeholder="e.g. Redeemer's University or Udemy" value={inst} onChangeText={setInst} />
        <Label text="Degree / Course / Certificate" />
        <Field placeholder="e.g. B.Sc. Computer Science or React Native Bootcamp" value={deg} onChangeText={setDeg} />
        <Label text="Period (optional)" />
        <Field placeholder="e.g. 2021 – Present" value={period} onChangeText={setPeriod} />
        <TouchableOpacity style={s.addBtn} onPress={add}>
          <Plus size={16} color="#fff" />
          <Text style={s.addBtnText}>Add Entry</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Experience Step ───────────────────────────────────────────

export function ExperienceStep({
  entries, setEntries,
}: { entries: ExperienceEntry[]; setEntries: (e: ExperienceEntry[]) => void }) {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [period, setPeriod] = useState('');
  const [desc, setDesc] = useState('');

  const add = () => {
    if (!company.trim() || !role.trim()) return;
    setEntries([...entries, { company: company.trim(), role: role.trim(), period: period.trim(), description: desc.trim() }]);
    setCompany(''); setRole(''); setPeriod(''); setDesc('');
  };

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

      <View style={s.formCard}>
        <Label text="Company / Organisation" />
        <Field placeholder="e.g. Access Bank or NITDA" value={company} onChangeText={setCompany} />
        <Label text="Role / Position" />
        <Field placeholder="e.g. Software Intern" value={role} onChangeText={setRole} />
        <Label text="Period (optional)" />
        <Field placeholder="e.g. Jun 2023 – Aug 2023" value={period} onChangeText={setPeriod} />
        <Label text="What did you do? (optional)" />
        <Field placeholder="Briefly describe your responsibilities and achievements…" value={desc} onChangeText={setDesc} multiline />
        <TouchableOpacity style={s.addBtn} onPress={add}>
          <Plus size={16} color="#fff" />
          <Text style={s.addBtnText}>Add Experience</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Projects Step ─────────────────────────────────────────────

export function ProjectsStep({
  entries, setEntries,
}: { entries: ProjectEntry[]; setEntries: (e: ProjectEntry[]) => void }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [tech, setTech] = useState('');

  const add = () => {
    if (!title.trim()) return;
    setEntries([...entries, { title: title.trim(), description: desc.trim(), technologies: tech.trim() }]);
    setTitle(''); setDesc(''); setTech('');
  };

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

      <View style={s.formCard}>
        <Label text="Project Name" />
        <Field placeholder="e.g. Student Portal App" value={title} onChangeText={setTitle} />
        <Label text="Description (optional)" />
        <Field placeholder="What does it do? What problem does it solve?" value={desc} onChangeText={setDesc} multiline />
        <Label text="Technologies Used (optional)" />
        <Field placeholder="e.g. React Native, Supabase, TypeScript" value={tech} onChangeText={setTech} />
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
