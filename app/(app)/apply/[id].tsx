import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, UploadCloud, FileText, MapPin, Clock,
  Briefcase, CheckCircle, X, Loader,
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Typography, Radii } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { supabase } from '@/lib/supabase';
import { formatNairaRange } from '@/constants/AppData';
import * as DocumentPicker from 'expo-document-picker';

interface Listing {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  work_mode: string | null;
  duration: string | null;
  salary_min: number | null;
  salary_max: number | null;
  deadline: string | null;
  is_siwes: boolean;
  required_skills: string[];
  organisation_profiles: { name: string; logo_url: string | null } | null;
}

interface MimsCV {
  target_role: string | null;
}

interface UploadedCV {
  name: string;
  url: string;
}

type CvMode = 'none' | 'upload' | 'mims';

export default function ApplyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);

  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoadingListing, setIsLoadingListing] = useState(true);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CV state
  const [cvMode, setCvMode] = useState<CvMode>('none');
  const [uploadedCV, setUploadedCV] = useState<UploadedCV | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [mimsCV, setMimsCV] = useState<MimsCV | null>(null);
  const [isLoadingMimsCV, setIsLoadingMimsCV] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setIsLoadingListing(true);
      const [listingRes, appRes] = await Promise.all([
        supabase
          .from('internship_listings')
          .select('*, organisation_profiles(name, logo_url)')
          .eq('id', id)
          .single(),
        profile?.id
          ? supabase
              .from('applications')
              .select('id')
              .eq('student_id', profile.id)
              .eq('listing_id', id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (listingRes.data) setListing(listingRes.data as Listing);
      if (appRes.data) setAlreadyApplied(true);
      setIsLoadingListing(false);
    };
    load();
  }, [id, profile?.id]);

  // --- CV Upload ---
  const pickAndUploadCV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setIsUploadingFile(true);

      const fileExt = file.name.split('.').pop() ?? 'pdf';
      const fileName = `${profile!.id}_${Date.now()}.${fileExt}`;

      // Read file as blob for upload
      const response = await fetch(file.uri);
      const blob = await response.blob();

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, blob, {
          contentType: file.mimeType ?? 'application/pdf',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(uploadData.path);

      setUploadedCV({ name: file.name, url: urlData.publicUrl });
      setCvMode('upload');
    } catch (err: any) {
      showToast(err.message || 'Could not upload file. Please try again.', 'error', 'Upload Failed');
    } finally {
      setIsUploadingFile(false);
    }
  };

  // --- Select MIMS Generated CV ---
  const selectMimsCV = async () => {
    if (!profile?.id) return;

    // Already loaded — just toggle selection
    if (mimsCV) {
      setCvMode(cvMode === 'mims' ? 'none' : 'mims');
      return;
    }

    setIsLoadingMimsCV(true);
    const { data, error } = await supabase
      .from('generated_cvs')
      .select('target_role')
      .eq('student_id', profile.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setIsLoadingMimsCV(false);

    if (error) {
      console.error("MIMS CV fetch error:", error);
    }

    if (error || !data) {
      showToast("You haven't generated a CV yet. Go to the CV Builder tab to create one.", 'info', 'No CV Found');
      // Navigate after toast
      setTimeout(() => {
        router.push('/(app)/(tabs)/cv-builder');
      }, 1000);
      return;
    }

    setMimsCV(data as MimsCV);
    setCvMode('mims');
  };

  const clearCV = () => {
    setCvMode('none');
    setUploadedCV(null);
  };

  // --- Submit Application ---
  const handleApply = async () => {
    if (!coverLetter.trim()) {
      showToast('Please provide a cover letter or note to the employer.', 'error', 'Missing Field');
      return;
    }
    if (!profile?.id || !id) {
      showToast('You must be signed in to apply.', 'error', 'Error');
      return;
    }
    if (alreadyApplied) {
      showToast('You have already submitted an application for this position.', 'error', 'Already Applied');
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from('applications').insert({
      student_id: profile.id,
      listing_id: id,
      cover_letter: coverLetter.trim(),
      cv_used: cvMode === 'mims',
      resume_url:
        cvMode === 'upload'
          ? uploadedCV?.url ?? null
          : null, // MIMS CV doesn't have a direct PDF URL yet
      status: 'Pending',
      timeline: ['Applied'],
    });

    setIsSubmitting(false);

    if (error) {
      showToast(error.message, 'error', 'Submission Failed');
    } else {
      setAlreadyApplied(true);
      showToast('Your application has been successfully sent to the employer.', 'success', 'Application Submitted! 🎉');
      setTimeout(() => {
        router.replace('/(app)/(tabs)/applications');
      }, 1500);
    }
  };

  if (isLoadingListing) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={24} color={Colors.light.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Apply</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primaryBlue} />
          <Text style={styles.loadingText}>Loading listing details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!listing) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={24} color={Colors.light.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Apply</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Listing not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const orgName = listing.organisation_profiles?.name ?? 'Organisation';
  const orgInitial = orgName.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.light.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Apply</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Listing Info Card */}
          <View style={styles.listingCard}>
            <View style={styles.listingLogoRow}>
              <View style={styles.listingLogo}>
                {listing.organisation_profiles?.logo_url ? (
                  <Image
                    source={{ uri: listing.organisation_profiles.logo_url }}
                    style={styles.listingLogoImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.listingLogoText}>{orgInitial}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.listingTitle}>{listing.title}</Text>
                <Text style={styles.listingOrg}>{orgName}</Text>
              </View>
            </View>
            <View style={styles.listingMeta}>
              {listing.location && (
                <View style={styles.metaItem}>
                  <MapPin size={13} color={Colors.light.textMuted} />
                  <Text style={styles.metaText}>{listing.location}</Text>
                </View>
              )}
              {listing.work_mode && (
                <View style={styles.metaItem}>
                  <Briefcase size={13} color={Colors.light.textMuted} />
                  <Text style={styles.metaText}>{listing.work_mode}</Text>
                </View>
              )}
              {listing.duration && (
                <View style={styles.metaItem}>
                  <Clock size={13} color={Colors.light.textMuted} />
                  <Text style={styles.metaText}>{listing.duration}</Text>
                </View>
              )}
              {listing.deadline && (
                <View style={styles.metaItem}>
                  <Clock size={13} color={Colors.light.textMuted} />
                  <Text style={styles.metaText}>
                    Deadline: {new Date(listing.deadline).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.listingSalary}>
              {formatNairaRange(listing.salary_min ?? 0, listing.salary_max ?? 0)} / month
            </Text>
            {listing.required_skills?.length > 0 && (
              <View style={styles.skillsRow}>
                {listing.required_skills.slice(0, 4).map((s) => (
                  <View key={s} style={styles.skillChip}>
                    <Text style={styles.skillChipText}>{s}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Description */}
          {listing.description && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionCardTitle}>About This Role</Text>
              <Text style={styles.sectionCardBody}>{listing.description}</Text>
            </View>
          )}

          {/* Required Skills */}
          {listing.required_skills?.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionCardTitle}>Required Skills</Text>
              <View style={styles.skillsRow}>
                {listing.required_skills.map((s) => (
                  <View key={s} style={styles.skillChip}>
                    <Text style={styles.skillChipText}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Already applied banner */}
          {alreadyApplied && (
            <View style={styles.alreadyAppliedBanner}>
              <Text style={styles.alreadyAppliedText}>✅ You have already applied for this position.</Text>
            </View>
          )}


          {/* Full Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={profile ? `${profile.first_name} ${profile.last_name}` : ''}
              editable={false}
            />
          </View>

          {/* CV Section */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Resume / CV</Text>

            {/* Active CV selection indicator */}
            {cvMode !== 'none' && (
              <View style={styles.cvSelectedBanner}>
                <CheckCircle size={16} color={Colors.light.success} />
                <Text style={styles.cvSelectedText}>
                  {cvMode === 'upload'
                    ? `Uploaded: ${uploadedCV?.name}`
                    : `MIMS CV selected${mimsCV?.target_role ? ` — ${mimsCV.target_role}` : ''}`}
                </Text>
                <TouchableOpacity onPress={clearCV} style={styles.cvClearBtn}>
                  <X size={14} color={Colors.light.textMuted} />
                </TouchableOpacity>
              </View>
            )}

            {/* Upload area */}
            <TouchableOpacity
              style={[styles.uploadArea, cvMode === 'upload' && styles.uploadAreaActive]}
              onPress={pickAndUploadCV}
              disabled={isUploadingFile || alreadyApplied}
            >
              {isUploadingFile ? (
                <>
                  <ActivityIndicator size="small" color={Colors.light.primaryBlue} />
                  <Text style={styles.uploadTitle}>Uploading...</Text>
                </>
              ) : cvMode === 'upload' ? (
                <>
                  <CheckCircle size={28} color={Colors.light.success} />
                  <Text style={[styles.uploadTitle, { color: Colors.light.success }]}>CV Uploaded</Text>
                  <Text style={styles.uploadSub}>Tap to replace</Text>
                </>
              ) : (
                <>
                  <UploadCloud size={28} color={Colors.light.primaryBlue} />
                  <Text style={styles.uploadTitle}>Upload Resume</Text>
                  <Text style={styles.uploadSub}>PDF, DOCX up to 5MB</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* MIMS Generated CV button */}
            <TouchableOpacity
              style={[styles.cvBuilderBtn, cvMode === 'mims' && styles.cvBuilderBtnActive]}
              onPress={selectMimsCV}
              disabled={isLoadingMimsCV || alreadyApplied}
            >
              {isLoadingMimsCV ? (
                <ActivityIndicator size="small" color={Colors.light.primaryBlue} />
              ) : cvMode === 'mims' ? (
                <CheckCircle size={20} color={Colors.light.success} />
              ) : (
                <FileText size={20} color={Colors.light.primaryBlue} />
              )}
              <Text style={[styles.cvBuilderBtnText, cvMode === 'mims' && { color: Colors.light.success }]}>
                {cvMode === 'mims' ? 'MIMS CV Selected ✓' : 'Use MIMS Generated CV'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Cover Letter */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Cover Letter (Recommended)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Why are you a great fit for this role?"
              placeholderTextColor={Colors.light.placeholder}
              multiline
              textAlignVertical="top"
              value={coverLetter}
              onChangeText={setCoverLetter}
              editable={!alreadyApplied}
            />
          </View>

          <View style={styles.spacing} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, (isSubmitting || alreadyApplied) && styles.submitBtnDisabled]}
          onPress={handleApply}
          disabled={isSubmitting || alreadyApplied}
        >
          <LinearGradient
            colors={
              isSubmitting || alreadyApplied
                ? ['#A0AABF', '#A0AABF']
                : [Colors.light.accentBlue, Colors.light.primaryBlue]
            }
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.submitText}>
              {alreadyApplied ? 'Already Applied' : isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { ...Typography.body, color: Colors.light.textMuted },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.light.border,
  },
  backBtn: { padding: 4, marginLeft: -4 },
  headerTitle: { fontFamily: 'DMSans_700Bold', fontSize: 18, color: Colors.light.textDark },
  scrollContent: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },

  // Listing card
  listingCard: {
    backgroundColor: Colors.light.white, borderRadius: Radii.card,
    padding: 18, borderWidth: 1, borderColor: Colors.light.cardBorder, marginBottom: 20,
  },
  listingLogoRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', marginBottom: 14 },
  listingLogo: {
    width: 50, height: 50, borderRadius: 14,
    backgroundColor: Colors.light.lightBlue, justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  listingLogoImage: { width: 50, height: 50, borderRadius: 14 },
  listingLogoText: { fontFamily: 'DMSans_700Bold', fontSize: 22, color: Colors.light.primaryBlue },
  listingTitle: { fontFamily: 'DMSans_700Bold', fontSize: 16, color: Colors.light.textDark, marginBottom: 3 },
  listingOrg: { ...Typography.label, color: Colors.light.textMuted },
  listingMeta: { gap: 6, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { ...Typography.label, color: Colors.light.textMuted },
  listingSalary: { fontFamily: 'DMSans_700Bold', fontSize: 15, color: Colors.light.primaryBlue, marginBottom: 12 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: Colors.light.lightBlue },
  skillChipText: { ...Typography.micro, color: Colors.light.accentBlue },

  // Description / Skills section cards
  sectionCard: {
    backgroundColor: Colors.light.white, borderRadius: Radii.card,
    padding: 18, borderWidth: 1, borderColor: Colors.light.cardBorder, marginBottom: 16,
  },
  sectionCardTitle: {
    fontFamily: 'DMSans_700Bold', fontSize: 14, color: Colors.light.textDark, marginBottom: 10,
  },
  sectionCardBody: {
    ...Typography.body, color: Colors.light.textMuted, lineHeight: 22,
  },


  alreadyAppliedBanner: {
    backgroundColor: Colors.light.success + '15',
    borderRadius: Radii.md, padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.light.success + '40',
  },
  alreadyAppliedText: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: Colors.light.success },

  formGroup: { marginBottom: 24 },
  label: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: Colors.light.textDark, marginBottom: 8 },
  input: {
    height: 52, backgroundColor: Colors.light.surfaceGrey,
    borderWidth: 1, borderColor: Colors.light.border,
    borderRadius: 12, paddingHorizontal: 16,
    ...Typography.body, color: Colors.light.textMuted,
  },

  // CV selection indicator
  cvSelectedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.light.success + '12',
    borderWidth: 1, borderColor: Colors.light.success + '40',
    borderRadius: 10, padding: 10, marginBottom: 12,
  },
  cvSelectedText: { flex: 1, fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: Colors.light.success },
  cvClearBtn: { padding: 2 },

  uploadArea: {
    borderWidth: 1.5, borderColor: Colors.light.primaryBlue + '50',
    borderStyle: 'dashed', borderRadius: Radii.card,
    paddingVertical: 28, alignItems: 'center',
    backgroundColor: Colors.light.lightBlue,
  },
  uploadAreaActive: {
    borderColor: Colors.light.success + '80',
    backgroundColor: Colors.light.success + '08',
  },
  uploadTitle: { fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.light.primaryBlue, marginTop: 12 },
  uploadSub: { ...Typography.micro, color: Colors.light.textMuted, marginTop: 4 },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.light.border },
  dividerText: { marginHorizontal: 12, ...Typography.micro, color: Colors.light.textMuted, fontFamily: 'DMSans_600SemiBold' },

  cvBuilderBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 52, borderWidth: 1.5, borderColor: Colors.light.primaryBlue,
    borderRadius: 12, backgroundColor: '#FFFFFF',
  },
  cvBuilderBtnActive: {
    borderColor: Colors.light.success,
    backgroundColor: Colors.light.success + '08',
  },
  cvBuilderBtnText: { fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: Colors.light.primaryBlue },

  textArea: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: Colors.light.border,
    borderRadius: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16,
    minHeight: 120, ...Typography.body, color: Colors.light.textDark,
  },
  spacing: { height: 40 },
  footer: {
    paddingHorizontal: 20, paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1, borderTopColor: Colors.light.border, backgroundColor: '#FFFFFF',
  },
  submitBtn: { borderRadius: Radii.button, overflow: 'hidden' },
  submitBtnDisabled: { opacity: 0.7 },
  submitGradient: { paddingVertical: 16, alignItems: 'center', borderRadius: Radii.button },
  submitText: { ...Typography.button, color: '#FFFFFF', fontSize: 16 },
});
