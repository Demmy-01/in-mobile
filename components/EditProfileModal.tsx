import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  X, Plus, Trash2, Save, User, BookOpen, Phone,
  Link2, Globe, Star, Camera, ImageIcon,
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Radii } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { supabase } from '@/lib/supabase';

const C = Colors.light;

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ visible, onClose }: Props) {
  const { profile, fetchProfile } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);
  const [isSaving, setIsSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [level, setLevel] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [gpa, setGpa] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [newHobby, setNewHobby] = useState('');

  // Image state
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Pre-fill form when modal opens
  useEffect(() => {
    if (visible && profile) {
      setFirstName(profile.first_name ?? '');
      setLastName(profile.last_name ?? '');
      setMatricNumber(profile.matric_number ?? '');
      setDepartment(profile.department ?? '');
      setLevel(profile.level ?? '');
      setPhone(profile.phone ?? '');
      setBio(profile.bio ?? '');
      setLinkedinUrl(profile.linkedin_url ?? '');
      setPortfolioUrl(profile.portfolio_url ?? '');
      setGpa(profile.gpa != null ? String(profile.gpa) : '');
      setSkills(Array.isArray(profile.skills) ? [...profile.skills] : []);
      setHobbies(Array.isArray(profile.hobbies) ? [...profile.hobbies] : []);
      setAvatarUri(profile.avatar_url ?? null);
      setCoverUri(profile.cover_url ?? null);
    }
  }, [visible, profile]);

  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !skills.includes(s)) setSkills(prev => [...prev, s]);
    setNewSkill('');
  };

  const addHobby = () => {
    const h = newHobby.trim();
    if (h && !hobbies.includes(h)) setHobbies(prev => [...prev, h]);
    setNewHobby('');
  };

  /** Pick an image from the gallery and upload it to Supabase Storage */
  const pickAndUpload = async (
    bucket: 'avatars' | 'covers',
    setUri: (uri: string) => void,
    setUploading: (v: boolean) => void,
  ) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast('Allow photo library access to upload images.', 'error', 'Permission needed');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: bucket === 'avatars' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const userId = profile?.id;
    if (!userId) return;

    setUploading(true);
    try {
      // Strip query params before extracting extension
      const rawExt = (asset.uri.split('.').pop() ?? 'jpg').split('?')[0].toLowerCase();
      const mimeType = rawExt === 'jpg' ? 'image/jpeg' : `image/${rawExt}`;
      const fileName = `${bucket}-${Date.now()}.${rawExt}`;
      const filePath = `${userId}/${fileName}`;

      // Use FormData — the ONLY approach that works on real devices in React Native.
      // fetch().blob() only works in browsers, not on iOS/Android.
      const formData = new FormData();
      formData.append('file', { uri: asset.uri, name: fileName, type: mimeType } as any);

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, formData, { upsert: true, contentType: mimeType });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      // Save URL to DB
      const col = bucket === 'avatars' ? 'avatar_url' : 'cover_url';
      const { error: dbError } = await supabase
        .from('student_profiles')
        .update({ [col]: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (dbError) throw dbError;

      // Update local preview and re-fetch profile to refresh global store
      setUri(publicUrl);
      await fetchProfile();
    } catch (err: any) {
      showToast(err.message ?? 'Something went wrong.', 'error', 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!firstName.trim()) {
      showToast('First name cannot be empty.', 'error', 'Required');
      return;
    }
    if (!lastName.trim()) {
      showToast('Last name cannot be empty.', 'error', 'Required');
      return;
    }

    const userId = profile?.id;
    if (!userId) {
      showToast('No user session found. Please sign out and sign in again.', 'error', 'Error');
      return;
    }

    setIsSaving(true);

    const updates = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      matric_number: matricNumber.trim() || null,
      department: department.trim() || null,
      level: level.trim() || null,
      phone: phone.trim() || null,
      bio: bio.trim() || null,
      linkedin_url: linkedinUrl.trim() || null,
      portfolio_url: portfolioUrl.trim() || null,
      gpa: gpa.trim() ? parseFloat(gpa.trim()) : null,
      skills,
      hobbies,
      avatar_url: avatarUri ?? profile?.avatar_url ?? null,
      cover_url: coverUri ?? profile?.cover_url ?? null,
      updated_at: new Date().toISOString(),
    };

    console.log('[EditProfile] Saving for user:', userId);
    console.log('[EditProfile] Updates:', JSON.stringify(updates));

    // Verify the session is still active
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setIsSaving(false);
      showToast('Your session has expired. Please sign out and sign in again.', 'error', 'Session Expired');
      return;
    }
    console.log('[EditProfile] Session uid:', sessionData.session.user.id);
    console.log('[EditProfile] Profile id:', userId);

    const { data, error } = await supabase
      .from('student_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    setIsSaving(false);

    if (error) {
      console.error('[EditProfile] Error code:', error.code);
      console.error('[EditProfile] Error message:', error.message);
      console.error('[EditProfile] Error details:', error.details);
      console.error('[EditProfile] Error hint:', error.hint);
      showToast(`Error: ${error.message}\n\nCode: ${error.code || 'unknown'}`, 'error', 'Save Failed');
      return;
    }

    if (!data) {
      showToast('No data returned. The row may not exist or RLS is blocking the update.', 'error', 'Save Failed');
      return;
    }

    console.log('[EditProfile] Saved successfully:', JSON.stringify(data));

    // Update the store immediately with the returned data
    const { setProfile } = useAuthStore.getState();
    setProfile({ ...profile!, ...data });

    showToast('Your profile has been updated.', 'success', 'Saved!');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: C.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} style={s.iconBtn}>
            <X size={20} color={C.textDark} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            style={[s.saveBtn, isSaving && { opacity: 0.6 }]}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Save size={14} color="#fff" />
                <Text style={s.saveBtnText}>Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Photos ── */}
          <SectionLabel icon={<Camera size={14} color={C.accentBlue} />} label="Photos" />

          {/* Cover photo tile */}
          <TouchableOpacity
            style={s.coverTile}
            onPress={() => pickAndUpload('covers', setCoverUri, setIsUploadingCover)}
            activeOpacity={0.8}
          >
            {coverUri ? (
              <Image source={{ uri: coverUri }} style={s.coverTileImg} />
            ) : (
              <View style={s.coverTilePlaceholder}>
                <ImageIcon size={28} color={C.textMuted} />
                <Text style={s.coverTilePlaceholderText}>Tap to add cover photo</Text>
              </View>
            )}
            {isUploadingCover && (
              <View style={s.uploadingOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
            {/* Camera badge */}
            <View style={s.coverCameraBadge}>
              <Camera size={13} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Avatar circle inside / below cover */}
          <View style={s.avatarPickerRow}>
            <TouchableOpacity
              style={s.avatarPickerCircle}
              onPress={() => pickAndUpload('avatars', setAvatarUri, setIsUploadingAvatar)}
              activeOpacity={0.8}
            >
              {isUploadingAvatar ? (
                <ActivityIndicator color={C.accentBlue} />
              ) : avatarUri ? (
                <Image source={{ uri: avatarUri }} style={s.avatarPickerImg} />
              ) : (
                <View style={s.avatarPickerInitial}>
                  <Text style={s.avatarPickerInitialText}>
                    {firstName.charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>
              )}
              <View style={s.avatarCameraBadge}>
                <Camera size={11} color="#fff" />
              </View>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.avatarHint}>Profile Photo</Text>
              <Text style={s.avatarHintSub}>Tap the circle to change</Text>
            </View>
          </View>

          {/* ── Personal ── */}
          <SectionLabel icon={<User size={14} color={C.accentBlue} />} label="Personal Information" />

          <View style={s.row}>
            <FieldWrap label="First Name" half>
              <TextInput
                style={s.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                placeholderTextColor={C.placeholder}
              />
            </FieldWrap>
            <FieldWrap label="Last Name" half>
              <TextInput
                style={s.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                placeholderTextColor={C.placeholder}
              />
            </FieldWrap>
          </View>

          <FieldWrap label="Phone" icon={<Phone size={14} color={C.textMuted} />}>
            <TextInput
              style={s.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+234..."
              placeholderTextColor={C.placeholder}
              keyboardType="phone-pad"
            />
          </FieldWrap>

          <FieldWrap label="Bio">
            <TextInput
              style={[s.input, s.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell employers about yourself..."
              placeholderTextColor={C.placeholder}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </FieldWrap>

          {/* ── Academic ── */}
          <SectionLabel icon={<BookOpen size={14} color={C.accentBlue} />} label="Academic Details" />

          <FieldWrap label="Matric Number">
            <TextInput
              style={s.input}
              value={matricNumber}
              onChangeText={setMatricNumber}
              placeholder="e.g. 20/ENG/CS/001"
              placeholderTextColor={C.placeholder}
              autoCapitalize="characters"
            />
          </FieldWrap>

          <FieldWrap label="Department" icon={<BookOpen size={14} color={C.textMuted} />}>
            <TextInput
              style={s.input}
              value={department}
              onChangeText={setDepartment}
              placeholder="e.g. Computer Science"
              placeholderTextColor={C.placeholder}
            />
          </FieldWrap>

          <View style={s.row}>
            <FieldWrap label="Level" half>
              <TextInput
                style={s.input}
                value={level}
                onChangeText={setLevel}
                placeholder="e.g. 300L"
                placeholderTextColor={C.placeholder}
              />
            </FieldWrap>
            <FieldWrap label="GPA" half>
              <TextInput
                style={s.input}
                value={gpa}
                onChangeText={setGpa}
                placeholder="e.g. 4.50"
                placeholderTextColor={C.placeholder}
                keyboardType="decimal-pad"
              />
            </FieldWrap>
          </View>

          {/* ── Online Presence ── */}
          <SectionLabel icon={<Globe size={14} color={C.accentBlue} />} label="Online Presence" />

          <FieldWrap label="LinkedIn URL" icon={<Link2 size={14} color={C.textMuted} />}>
            <TextInput
              style={s.input}
              value={linkedinUrl}
              onChangeText={setLinkedinUrl}
              placeholder="https://linkedin.com/in/..."
              placeholderTextColor={C.placeholder}
              keyboardType="url"
              autoCapitalize="none"
            />
          </FieldWrap>

          <FieldWrap label="Portfolio / Website" icon={<Globe size={14} color={C.textMuted} />}>
            <TextInput
              style={s.input}
              value={portfolioUrl}
              onChangeText={setPortfolioUrl}
              placeholder="https://yoursite.com"
              placeholderTextColor={C.placeholder}
              keyboardType="url"
              autoCapitalize="none"
            />
          </FieldWrap>

          {/* ── Skills ── */}
          <SectionLabel icon={<Star size={14} color={C.accentBlue} />} label="Skills" />
          <View style={s.chips}>
            {skills.map(sk => (
              <View key={sk} style={s.chip}>
                <Text style={s.chipText}>{sk}</Text>
                <TouchableOpacity onPress={() => setSkills(p => p.filter(x => x !== sk))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Trash2 size={11} color={C.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <View style={s.addRow}>
            <TextInput
              style={[s.input, s.addInput]}
              value={newSkill}
              onChangeText={setNewSkill}
              placeholder="Add a skill..."
              placeholderTextColor={C.placeholder}
              onSubmitEditing={addSkill}
              returnKeyType="done"
              blurOnSubmit={false}
            />
            <TouchableOpacity onPress={addSkill} style={s.addBtn}>
              <Plus size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* ── Hobbies ── */}
          <SectionLabel icon={<Star size={14} color={C.accentBlue} />} label="Hobbies & Interests" />
          <View style={s.chips}>
            {hobbies.map(h => (
              <View key={h} style={s.chip}>
                <Text style={s.chipText}>{h}</Text>
                <TouchableOpacity onPress={() => setHobbies(p => p.filter(x => x !== h))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Trash2 size={11} color={C.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <View style={s.addRow}>
            <TextInput
              style={[s.input, s.addInput]}
              value={newHobby}
              onChangeText={setNewHobby}
              placeholder="Add a hobby..."
              placeholderTextColor={C.placeholder}
              onSubmitEditing={addHobby}
              returnKeyType="done"
              blurOnSubmit={false}
            />
            <TouchableOpacity onPress={addHobby} style={s.addBtn}>
              <Plus size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ── Sub-components ── */

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={s.sectionLabel}>
      {icon}
      <Text style={s.sectionLabelText}>{label}</Text>
    </View>
  );
}

function FieldWrap({
  label,
  icon,
  half,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  half?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={[s.fieldWrap, half && { flex: 1 }]}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.inputWrap}>
        {icon ? <View style={s.inputIcon}>{icon}</View> : null}
        {children}
      </View>
    </View>
  );
}

/* ── Styles ── */
const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
    backgroundColor: C.white,
  },
  iconBtn: { padding: 4 },
  headerTitle: { fontFamily: 'DMSans_700Bold', fontSize: 17, color: C.textDark },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.accentBlue,
    borderRadius: Radii.button,
    paddingHorizontal: 16,
    paddingVertical: 9,
    minWidth: 74,
    justifyContent: 'center',
  },
  saveBtnText: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#fff' },

  body: { padding: 20 },

  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  sectionLabelText: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: C.accentBlue },

  row: { flexDirection: 'row', gap: 12 },

  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: C.textMuted, marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.inputBorder,
    borderRadius: Radii.sm,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: C.textDark,
    paddingVertical: 10,
  },
  textArea: {
    minHeight: 90,
    paddingTop: 10,
    textAlignVertical: 'top',
  },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.lightBlue,
    borderRadius: Radii.chip,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: C.accentBlue },

  addRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  addInput: {
    flex: 1,
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.inputBorder,
    borderRadius: Radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 46,
  },
  addBtn: {
    backgroundColor: C.accentBlue,
    borderRadius: Radii.sm,
    width: 46,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Photos section
  coverTile: {
    height: 130,
    borderRadius: Radii.card,
    overflow: 'hidden',
    backgroundColor: C.surfaceGrey,
    borderWidth: 1,
    borderColor: C.inputBorder,
    marginBottom: 0,
    position: 'relative',
  },
  coverTileImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  coverTilePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  coverTilePlaceholderText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: C.textMuted,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverCameraBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: C.accentBlue,
    borderRadius: 20,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 14,
    marginBottom: 4,
  },
  avatarPickerCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: C.lightBlue,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: C.accentBlue,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarPickerImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  avatarPickerInitial: { justifyContent: 'center', alignItems: 'center' },
  avatarPickerInitialText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 26,
    color: C.accentBlue,
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: C.accentBlue,
    borderRadius: 12,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHint: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: C.textDark,
  },
  avatarHintSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: C.textMuted,
    marginTop: 2,
  },
});
