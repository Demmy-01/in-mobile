
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useToastStore } from '@/store/toastStore';
import { Colors } from '@/constants/Colors';
import { LogOut, Check, X, AlertTriangle } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function GlobalConfirmModal() {
  const { confirmVisible, confirmTitle, confirmDescription, confirmLabel, cancelLabel, onConfirm, onCancel } = useToastStore();

  if (!confirmVisible) return null;

  // Determine if it looks like a logout/destructive modal to show appropriate styling
  const isDestructive = confirmTitle.toLowerCase().includes('sign out') || 
                        confirmTitle.toLowerCase().includes('log out') ||
                        confirmTitle.toLowerCase().includes('delete') ||
                        confirmTitle.toLowerCase().includes('remove');

  return (
    <Modal
      transparent
      animationType="fade"
      visible={confirmVisible}
      onRequestClose={() => {
        if (onCancel) onCancel();
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Top visual accent */}
          <View style={[
            styles.iconContainer,
            { backgroundColor: isDestructive ? '#FEE2E2' : '#EFF6FF' }
          ]}>
            {isDestructive ? (
              <LogOut size={26} color="#EF4444" />
            ) : (
              <AlertTriangle size={26} color="#3B82F6" />
            )}
          </View>

          {/* Texts */}
          <Text style={styles.title}>{confirmTitle}</Text>
          <Text style={styles.description}>{confirmDescription}</Text>

          {/* Button actions */}
          <View style={styles.btnRow}>
            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelBtn}
              activeOpacity={0.8}
              onPress={() => {
                if (onCancel) onCancel();
              }}
            >
              <Text style={styles.cancelBtnText}>{cancelLabel}</Text>
            </TouchableOpacity>

            {/* Confirm Button */}
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                { backgroundColor: isDestructive ? '#EF4444' : '#1C315E' }
              ]}
              activeOpacity={0.8}
              onPress={() => {
                if (onConfirm) onConfirm();
              }}
            >
              <Text style={styles.confirmBtnText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 15,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13.5,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
    paddingHorizontal: 6,
  },
  btnRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: '#4B5563',
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
