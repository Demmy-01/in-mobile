import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Image,
  Animated,
  LayoutAnimation,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';
import { Typography, Radii } from '@/constants/theme';


const { width, height } = Dimensions.get('window');

// --- Slide 1: Image from assets ---
const Slide1Illustration = () => (
  <Image
    source={require('../assets/onboard-1.png')}
    style={{ width, height: height * 0.55 }}
    resizeMode="contain"
  />
);

const Slide2Illustration = () => (
  <Image
    source={require('../assets/onboard-2.png')}
    style={{ width, height: height * 0.55 }}
    resizeMode="contain"
  />
);

const Slide3Illustration = () => (
  <Image
    source={require('../assets/onboard-3.png')}
    style={{ width, height: height * 0.55 }}
    resizeMode="contain"
  />
);

const slides = [
  {
    id: '1',
    title: 'Find Your Dream Internship\nNow Here',
    subtitle: 'Discover internships tailored to your skills and interests.',
    background: ['#1A2B5E', '#0D2348'] as const,
    titleColor: '#FFFFFF',
    subtitleColor: 'rgba(255,255,255,0)',
    illustration: <Slide1Illustration />,
    dark: true,
  },
  {
    id: '2',
    title: 'Build a CV That\nGets You In',
    subtitle: 'AI generates a personalized, role-specific CV from your academic profile — no generic templates.',
    background: ['#FFFFFF', '#F5F7FA'] as const,
    titleColor: '#0D1B2A',
    subtitleColor: '#8A9BB0',
    illustration: <Slide2Illustration />,
    dark: false,
  },
  {
    id: '3',
    title: 'Practice Until\nYou\'re Ready',
    subtitle: 'Simulate real internship interviews with AI-generated questions and instant feedback.',
    background: ['#E8F0FE', '#DDEAFF'] as const,
    titleColor: '#0D1B2A',
    subtitleColor: '#8A9BB0',
    illustration: <Slide3Illustration />,
    dark: false,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const bgAnims = useRef(slides.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;

      // Crossfade backgrounds smoothly over 400ms
      Animated.timing(bgAnims[currentIndex], {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
      Animated.timing(bgAnims[nextIndex], {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

      // Slide and fade out the foreground content
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -40,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start(() => {
        // LayoutAnimation smoothly animates the dot widths when they change
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setCurrentIndex(nextIndex);
        
        // Reset position to the right side to slide in
        slideAnim.setValue(40);

        // Slide and fade in the new foreground content
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          })
        ]).start();
      });
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('has_seen_onboarding', 'true');
    router.replace('/(auth)/sign-in');
  };

  const handleGetStarted = async () => {
    await AsyncStorage.setItem('has_seen_onboarding', 'true');
    router.replace('/(auth)/sign-up');
  };

  const currentSlide = slides[currentIndex];

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={currentSlide.dark ? 'light-content' : 'dark-content'}
        backgroundColor={currentSlide.background[0]}
      />
      
      {/* Backgrounds (Crossfading) */}
      {slides.map((slide, i) => (
        <Animated.View key={slide.id} style={[StyleSheet.absoluteFillObject, { opacity: bgAnims[i] }]}>
          <LinearGradient
            colors={slide.background}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      ))}

      {/* Illustration Area */}
      <Animated.View style={[styles.illustrationContainer, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
        {currentSlide.illustration}
      </Animated.View>

      {/* Content Area */}
      <View style={styles.contentArea}>
        {/* Dots */}
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: currentSlide.dark ? '#FFFFFF' : Colors.light.primaryBlue,
                  opacity: i === currentIndex ? 1 : 0.3,
                  width: i === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Text */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
          <Text style={[styles.title, { color: currentSlide.titleColor }]}>
            {currentSlide.title}
          </Text>
          <Text style={[styles.subtitle, { color: currentSlide.subtitleColor }]}>
            {currentSlide.subtitle}
          </Text>
        </Animated.View>

        {/* Buttons */}
        {currentIndex < slides.length - 1 ? (
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
              <Text style={[styles.skipText, { color: currentSlide.dark ? 'rgba(255,255,255,0.7)' : Colors.light.textMuted }]}>
                Skip
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleNext}
              style={[
                styles.nextBtn,
                { backgroundColor: currentSlide.dark ? '#FFFFFF' : Colors.light.primaryBlue },
              ]}
            >
              <Text style={[styles.nextText, { color: currentSlide.dark ? Colors.light.primaryBlue : '#FFFFFF' }]}>
                Next →
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.finalButtons}>
            <TouchableOpacity style={styles.getStartedBtn} onPress={handleGetStarted}>
              <LinearGradient
                colors={[Colors.light.accentBlue, Colors.light.primaryBlue]}
                style={styles.getStartedGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.getStartedText}>Get Started</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSkip} style={styles.signInLink}>
              <Text style={styles.signInText}>
                Already have an account?{' '}
                <Text style={{ color: Colors.light.accentBlue, fontFamily: 'DMSans_600SemiBold' }}>
                  Sign In
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  illustrationContainer: {
    flex: 1,
    maxHeight: height * 0.55,
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  title: {
    ...Typography.displaySm,
    marginTop: 8,
  },
  subtitle: {
    ...Typography.bodyLg,
    marginTop: 12,
    lineHeight: 26,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  skipBtn: {
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  skipText: {
    ...Typography.button,
  },
  nextBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: Radii.chip,
  },
  nextText: {
    ...Typography.button,
  },
  finalButtons: {
    gap: 16,
    marginTop: 16,
  },
  getStartedBtn: {
    borderRadius: Radii.button,
    overflow: 'hidden',
  },
  getStartedGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: Radii.button,
  },
  getStartedText: {
    ...Typography.button,
    color: '#FFFFFF',
    fontSize: 16,
  },
  signInLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  signInText: {
    ...Typography.body,
    color: Colors.light.textMuted,
  },
});
