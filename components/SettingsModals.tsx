import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, TextInput, Alert, ActivityIndicator, Linking, KeyboardAvoidingView, Platform,
} from 'react-native';
import {
  X, Bell, Lock, Key, HelpCircle, Info, ChevronRight, Mail, MessageSquare,
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Radii, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const C = Colors.light;

/* ── Shared shell ── */
function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={sh.header}>
        <TouchableOpacity onPress={onClose} style={sh.close}><X size={20} color={C.textDark} /></TouchableOpacity>
        <Text style={sh.title}>{title}</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </Modal>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return <View style={sh.card}>{children}</View>;
}

function RowItem({ label, sub, right }: { label: string; sub?: string; right?: React.ReactNode }) {
  return (
    <View style={sh.row}>
      <View style={{ flex: 1 }}>
        <Text style={sh.rowLabel}>{label}</Text>
        {sub ? <Text style={sh.rowSub}>{sub}</Text> : null}
      </View>
      {right}
    </View>
  );
}

/* ── Notification Preferences ── */
export function NotificationsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [appUpdates, setAppUpdates] = useState(true);
  const [newListings, setNewListings] = useState(true);
  const [statusChanges, setStatusChanges] = useState(true);
  const [deadlines, setDeadlines] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);

  return (
    <Sheet visible={visible} onClose={onClose} title="Notification Preferences">
      <Text style={sh.desc}>Choose what you want to be notified about.</Text>
      <SectionCard>
        <RowItem label="Application updates" sub="Status changes on your applications" right={<Switch value={statusChanges} onValueChange={setStatusChanges} trackColor={{ true: C.accentBlue }} thumbColor="#fff" />} />
        <View style={sh.divider} />
        <RowItem label="New internship listings" sub="Listings that match your profile" right={<Switch value={newListings} onValueChange={setNewListings} trackColor={{ true: C.accentBlue }} thumbColor="#fff" />} />
        <View style={sh.divider} />
        <RowItem label="Upcoming deadlines" sub="Reminders 3 days before deadline" right={<Switch value={deadlines} onValueChange={setDeadlines} trackColor={{ true: C.accentBlue }} thumbColor="#fff" />} />
        <View style={sh.divider} />
        <RowItem label="App updates & announcements" right={<Switch value={appUpdates} onValueChange={setAppUpdates} trackColor={{ true: C.accentBlue }} thumbColor="#fff" />} />
        <View style={sh.divider} />
        <RowItem label="Weekly email digest" sub="Summary of activity sent to your email" right={<Switch value={emailDigest} onValueChange={setEmailDigest} trackColor={{ true: C.accentBlue }} thumbColor="#fff" />} />
      </SectionCard>
      <TouchableOpacity style={sh.saveBtn} onPress={() => { Alert.alert('Saved', 'Notification preferences updated.'); onClose(); }}>
        <Text style={sh.saveBtnText}>Save Preferences</Text>
      </TouchableOpacity>
    </Sheet>
  );
}

/* ── Privacy Settings ── */
export function PrivacyModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [profileVisible, setProfileVisible] = useState(true);
  const [cvVisible, setCvVisible] = useState(false);
  const [showGpa, setShowGpa] = useState(false);
  const [allowContact, setAllowContact] = useState(true);

  return (
    <Sheet visible={visible} onClose={onClose} title="Privacy Settings">
      <Text style={sh.desc}>Control what information organisations can see.</Text>
      <SectionCard>
        <RowItem label="Profile visible to organisations" sub="Allow organisations to find your profile" right={<Switch value={profileVisible} onValueChange={setProfileVisible} trackColor={{ true: C.accentBlue }} thumbColor="#fff" />} />
        <View style={sh.divider} />
        <RowItem label="CV publicly accessible" sub="Organisations can view your generated CV" right={<Switch value={cvVisible} onValueChange={setCvVisible} trackColor={{ true: C.accentBlue }} thumbColor="#fff" />} />
        <View style={sh.divider} />
        <RowItem label="Show GPA on profile" sub="Display your academic GPA to recruiters" right={<Switch value={showGpa} onValueChange={setShowGpa} trackColor={{ true: C.accentBlue }} thumbColor="#fff" />} />
        <View style={sh.divider} />
        <RowItem label="Allow direct contact" sub="Organisations can message you directly" right={<Switch value={allowContact} onValueChange={setAllowContact} trackColor={{ true: C.accentBlue }} thumbColor="#fff" />} />
      </SectionCard>
      <TouchableOpacity style={sh.saveBtn} onPress={() => { Alert.alert('Saved', 'Privacy settings updated.'); onClose(); }}>
        <Text style={sh.saveBtnText}>Save Settings</Text>
      </TouchableOpacity>
    </Sheet>
  );
}

/* ── Change Password ── */
export function ChangePasswordModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = async () => {
    if (newPassword.length < 6) { Alert.alert('Too short', 'Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('Mismatch', 'Passwords do not match.'); return; }
    setIsSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsSaving(false);
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert('Done!', 'Your password has been updated.');
    setNewPassword(''); setConfirmPassword('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={sh.header}>
          <TouchableOpacity onPress={onClose} style={sh.close}><X size={20} color={C.textDark} /></TouchableOpacity>
          <Text style={sh.title}>Change Password</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={{ padding: 20 }}>
          <Text style={sh.desc}>Choose a new password for your account.</Text>
          <SectionCard>
            <Text style={sh.fieldLabel}>New Password</Text>
            <TextInput
              style={sh.textInput}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="At least 6 characters"
              placeholderTextColor={C.placeholder}
            />
            <View style={sh.divider} />
            <Text style={sh.fieldLabel}>Confirm Password</Text>
            <TextInput
              style={sh.textInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="Repeat new password"
              placeholderTextColor={C.placeholder}
            />
          </SectionCard>
          <TouchableOpacity style={sh.saveBtn} onPress={handleChange} disabled={isSaving}>
            {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={sh.saveBtnText}>Update Password</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={sh.linkBtn}
            onPress={async () => {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user?.email) return;
              await supabase.auth.resetPasswordForEmail(user.email);
              Alert.alert('Sent!', 'Check your email for a password reset link.');
            }}
          >
            <Text style={sh.linkBtnText}>Send reset link to my email instead</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ── Help & Support ── */
export function HelpModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const faqs = [
    { q: 'How do I apply for an internship?', a: 'Go to the Search tab, find a listing you like, and tap "Apply Now". Fill in your cover letter and submit.' },
    { q: 'How is my match score calculated?', a: 'Match scores are based on your skills, department, and level compared to the internship requirements.' },
    { q: 'Can I edit my application after submitting?', a: 'No. Once submitted, applications cannot be edited. You can withdraw and reapply if the deadline hasn\'t passed.' },
    { q: 'How do I generate a CV?', a: 'Go to the CV Builder tab. Fill in your details and tap "Generate CV" to create a professional CV.' },
    { q: 'How do I update my profile?', a: 'Tap the "Edit" button at the top of the Profile tab to update your personal and academic information.' },
  ];
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Sheet visible={visible} onClose={onClose} title="Help & Support">
      <Text style={sh.desc}>Frequently asked questions and contact options.</Text>
      <Text style={[sh.fieldLabel, { marginBottom: 12, color: C.textDark, fontSize: 14 }]}>FAQs</Text>
      {faqs.map((faq, i) => (
        <View key={i} style={[sh.card, { marginBottom: 10 }]}>
          <TouchableOpacity style={sh.faqQ} onPress={() => setOpenIndex(openIndex === i ? null : i)}>
            <Text style={sh.faqQText}>{faq.q}</Text>
            <ChevronRight size={16} color={C.textMuted} style={{ transform: [{ rotate: openIndex === i ? '90deg' : '0deg' }] }} />
          </TouchableOpacity>
          {openIndex === i && <Text style={sh.faqA}>{faq.a}</Text>}
        </View>
      ))}
      <Text style={[sh.fieldLabel, { marginTop: 20, marginBottom: 12, color: C.textDark, fontSize: 14 }]}>Contact Us</Text>
      <SectionCard>
        <TouchableOpacity style={sh.row} onPress={() => Linking.openURL('mailto:support@mims.edu.ng')}>
          <Mail size={18} color={C.accentBlue} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={sh.rowLabel}>Email Support</Text>
            <Text style={sh.rowSub}>support@mims.edu.ng</Text>
          </View>
          <ChevronRight size={16} color={C.textMuted} />
        </TouchableOpacity>
        <View style={sh.divider} />
        <TouchableOpacity style={sh.row} onPress={() => Alert.alert('Coming Soon', 'Live chat will be available in the next update.')}>
          <MessageSquare size={18} color={C.accentBlue} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={sh.rowLabel}>Live Chat</Text>
            <Text style={sh.rowSub}>Available Mon–Fri, 9am–5pm</Text>
          </View>
          <ChevronRight size={16} color={C.textMuted} />
        </TouchableOpacity>
      </SectionCard>
    </Sheet>
  );
}

/* ── About MIMS ── */
export function AboutModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Sheet visible={visible} onClose={onClose} title="About MIMS">
      <View style={[sh.card, { alignItems: 'center', paddingVertical: 28 }]}>
        <View style={sh.appIcon}>
          <Text style={{ fontSize: 36 }}>🎓</Text>
        </View>
        <Text style={sh.appName}>MIMS</Text>
        <Text style={sh.appVersion}>Mobile Internship Management System</Text>
        <Text style={sh.appVersionSub}>Version 1.0.0</Text>
      </View>
      <SectionCard>
        <Text style={sh.aboutText}>
          MIMS is a student internship platform designed to bridge the gap between students and organisations offering internship opportunities. It streamlines the application process, CV generation, and placement tracking all in one place.
        </Text>
      </SectionCard>
      <SectionCard>
        <TouchableOpacity style={sh.row} onPress={() => Alert.alert('Terms', 'Full terms of service will be available soon.')}>
          <Text style={sh.rowLabel}>Terms of Service</Text>
          <ChevronRight size={16} color={C.textMuted} />
        </TouchableOpacity>
        <View style={sh.divider} />
        <TouchableOpacity style={sh.row} onPress={() => Alert.alert('Privacy', 'Full privacy policy will be available soon.')}>
          <Text style={sh.rowLabel}>Privacy Policy</Text>
          <ChevronRight size={16} color={C.textMuted} />
        </TouchableOpacity>
        <View style={sh.divider} />
        <TouchableOpacity style={sh.row} onPress={() => Linking.openURL('https://github.com')}>
          <Text style={sh.rowLabel}>Open Source Licenses</Text>
          <ChevronRight size={16} color={C.textMuted} />
        </TouchableOpacity>
      </SectionCard>
      <Text style={[sh.appVersionSub, { textAlign: 'center', marginTop: 24, color: C.placeholder }]}>
        Built with ❤️ for Nigerian students
      </Text>
    </Sheet>
  );
}

const sh = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.borderLight, backgroundColor: C.white },
  close: { padding: 4 },
  title: { fontFamily: 'DMSans_700Bold', fontSize: 17, color: C.textDark },
  desc: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: C.textMuted, marginBottom: 20, lineHeight: 21 },
  card: { backgroundColor: C.white, borderRadius: Radii.card, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  rowLabel: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: C.textDark },
  rowSub: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: C.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: C.borderLight, marginHorizontal: 16 },
  saveBtn: { backgroundColor: C.accentBlue, borderRadius: Radii.button, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  saveBtnText: { fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: '#fff' },
  linkBtn: { paddingVertical: 14, alignItems: 'center' },
  linkBtnText: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: C.accentBlue },
  fieldLabel: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: C.textMuted, marginBottom: 6, paddingHorizontal: 16, paddingTop: 12 },
  textInput: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: C.textDark, paddingHorizontal: 16, paddingBottom: 14 },
  faqQ: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  faqQText: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: C.textDark, flex: 1, marginRight: 8 },
  faqA: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: C.textMuted, paddingHorizontal: 14, paddingBottom: 14, lineHeight: 20 },
  appIcon: { width: 80, height: 80, borderRadius: 20, backgroundColor: C.lightBlue, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  appName: { fontFamily: 'Fraunces_700Bold', fontSize: 28, color: C.primaryBlue, marginBottom: 4 },
  appVersion: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: C.textMuted, marginBottom: 4 },
  appVersionSub: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: C.placeholder },
  aboutText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: C.textDark, lineHeight: 22, padding: 16 },
});
