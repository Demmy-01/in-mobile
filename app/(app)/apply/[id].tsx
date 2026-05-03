import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, UploadCloud, FileText } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Typography, Radii } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/authStore';

export default function ApplyScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { profile } = useAuthStore();
  
  const [coverLetter, setCoverLetter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // In a real app, we'd fetch the internship details using the `id`.
  // For now, we'll use a placeholder.
  const roleName = "Internship Position";

  const handleApply = () => {
    if (!coverLetter.trim()) {
      Alert.alert('Missing Field', 'Please provide a cover letter or note to the employer.');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Application Submitted! 🎉',
        'Your application has been successfully sent to the employer.',
        [
          { text: 'View Applications', onPress: () => router.replace('/(app)/(tabs)/applications') },
          { text: 'Back to Search', onPress: () => router.back() }
        ]
      );
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.light.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Apply</Text>
        <View style={{ width: 24 }} /> {/* Spacer */}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.roleInfo}>
            <Text style={styles.applyingFor}>You are applying for:</Text>
            <Text style={styles.roleName}>{roleName}</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={profile ? `${profile.first_name} ${profile.last_name}` : ''}
              editable={false}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Resume / CV</Text>
            <TouchableOpacity style={styles.uploadArea}>
              <UploadCloud size={28} color={Colors.light.primaryBlue} />
              <Text style={styles.uploadTitle}>Upload Resume</Text>
              <Text style={styles.uploadSub}>PDF, DOCX up to 5MB</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.cvBuilderBtn} onPress={() => router.push('/(app)/(tabs)/cv-builder')}>
              <FileText size={20} color={Colors.light.primaryBlue} />
              <Text style={styles.cvBuilderBtnText}>Use MIMS Generated CV</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Cover Letter (Optional but recommended)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Why are you a great fit for this role?"
              placeholderTextColor={Colors.light.placeholder}
              multiline
              textAlignVertical="top"
              value={coverLetter}
              onChangeText={setCoverLetter}
            />
          </View>

          <View style={styles.spacing} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
          onPress={handleApply}
          disabled={isSubmitting}
        >
          <LinearGradient
            colors={isSubmitting ? ['#A0AABF', '#A0AABF'] : [Colors.light.accentBlue, Colors.light.primaryBlue]}
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.submitText}>
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    color: Colors.light.textDark,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  roleInfo: {
    marginBottom: 32,
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.light.surfaceGrey,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  applyingFor: {
    ...Typography.body,
    color: Colors.light.textMuted,
    marginBottom: 4,
  },
  roleName: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    color: Colors.light.textDark,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: Colors.light.textDark,
    marginBottom: 8,
  },
  input: {
    height: 52,
    backgroundColor: Colors.light.surfaceGrey,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    ...Typography.body,
    color: Colors.light.textMuted, // muted because disabled
  },
  uploadArea: {
    borderWidth: 1,
    borderColor: Colors.light.primaryBlue + '50',
    borderStyle: 'dashed',
    borderRadius: Radii.card,
    paddingVertical: 28,
    alignItems: 'center',
    backgroundColor: Colors.light.lightBlue,
  },
  uploadTitle: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: Colors.light.primaryBlue,
    marginTop: 12,
  },
  uploadSub: {
    ...Typography.micro,
    color: Colors.light.textMuted,
    marginTop: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.border,
  },
  dividerText: {
    marginHorizontal: 12,
    ...Typography.micro,
    color: Colors.light.textMuted,
    fontFamily: 'DMSans_600SemiBold',
  },
  cvBuilderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderWidth: 1,
    borderColor: Colors.light.primaryBlue,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  cvBuilderBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: Colors.light.primaryBlue,
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    minHeight: 120,
    ...Typography.body,
    color: Colors.light.textDark,
  },
  spacing: {
    height: 40,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: '#FFFFFF',
  },
  submitBtn: {
    borderRadius: Radii.button,
    overflow: 'hidden',
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: Radii.button,
  },
  submitText: {
    ...Typography.button,
    color: '#FFFFFF',
    fontSize: 16,
  },
});
