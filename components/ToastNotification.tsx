/**
 * components/ToastNotification.tsx
 * Premium animated sliding toast component for custom success, error, and info alerts.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';
import { useToastStore } from '@/store/toastStore';
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');

export default function ToastNotification() {
  const { toastVisible, toastMessage, toastType, toastTitle, hideToast } = useToastStore();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = React.useState(toastVisible);

  useEffect(() => {
    if (toastVisible) {
      setShouldRender(true);
      // Slide in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: insets.top > 0 ? insets.top + 8 : 16,
          useNativeDriver: true,
          tension: 80,
          friction: 9,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -150,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShouldRender(false);
      });
    }
  }, [toastVisible, insets.top]);

  if (!shouldRender) return null;

  // Curated theme colours and icons
  let bgColour = '#FFFFFF';
  let borderColour = '#E5E7EB';
  let Icon = Info;
  let iconColour = '#3B82F6';

  if (toastType === 'success') {
    bgColour = '#F0FDF4'; // light green
    borderColour = '#DCFCE7';
    Icon = CheckCircle2;
    iconColour = '#22C55E'; // green-500
  } else if (toastType === 'error') {
    bgColour = '#FEF2F2'; // light red
    borderColour = '#FEE2E2';
    Icon = AlertCircle;
    iconColour = '#EF4444'; // red-500
  } else if (toastType === 'info') {
    bgColour = '#EFF6FF'; // light blue
    borderColour = '#DBEAFE';
    Icon = Info;
    iconColour = '#3B82F6'; // blue-500
  }

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: bgColour,
          borderColor: borderColour,
        },
      ]}
    >
      <View style={styles.contentRow}>
        <View style={[styles.iconWrapper, { backgroundColor: iconColour + '18' }]}>
          <Icon size={20} color={iconColour} />
        </View>

        <View style={styles.textColumn}>
          <Text style={[styles.title, { color: iconColour }]}>{toastTitle}</Text>
          <Text style={styles.message} numberOfLines={3}>
            {toastMessage}
          </Text>
        </View>

        <TouchableOpacity onPress={hideToast} style={styles.closeBtn} activeOpacity={0.7}>
          <X size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 99999,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textColumn: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    marginBottom: 2,
  },
  message: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12.5,
    color: '#4B5563',
    lineHeight: 17,
  },
  closeBtn: {
    padding: 6,
  },
});
