import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Animated,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';
import { Typography, Radii } from '@/constants/theme';
import Svg, { Circle, Ellipse, Rect, Path, G, Defs, RadialGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// --- SVG Illustrations ---
const Slide1Illustration = () => (
  <Svg width={width} height={height * 0.55} viewBox={`0 0 ${width} ${height * 0.55}`}>
    <Defs>
      <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#2D6BE4" stopOpacity="0.4" />
        <Stop offset="100%" stopColor="#1A3A6B" stopOpacity="0" />
      </RadialGradient>
    </Defs>
    <Circle cx={width * 0.5} cy={height * 0.27} r={160} fill="url(#glow)" />
    {/* Floating geometric shapes */}
    <Rect x={width * 0.1} y={80} width={60} height={60} rx={12} fill="#2D6BE4" opacity={0.3} transform="rotate(-15 60 60)" />
    <Rect x={width * 0.75} y={50} width={44} height={44} rx={8} fill="#2D6BE4" opacity={0.4} transform="rotate(20 88 44)" />
    <Circle cx={width * 0.15} cy={200} r={20} fill="#2D6BE4" opacity={0.25} />
    <Circle cx={width * 0.85} cy={180} r={30} fill="#2D6BE4" opacity={0.2} />
    <Ellipse cx={width * 0.5} cy={height * 0.2} rx={70} ry={70} fill="#2D6BE4" opacity={0.15} />
    {/* Center icon — briefcase */}
    <G transform={`translate(${width * 0.5 - 60}, ${height * 0.15})`}>
      <Rect x={5} y={20} width={110} height={80} rx={14} fill="#FFFFFF" opacity={0.12} />
      <Rect x={35} y={8} width={50} height={20} rx={6} fill="#FFFFFF" opacity={0.18} />
      <Rect x={5} y={46} width={110} height={8} rx={4} fill="#2D6BE4" opacity={0.6} />
      <Circle cx={60} cy={50} r={8} fill="#FFFFFF" opacity={0.9} />
    </G>
    {/* Small floating cards */}
    <Rect x={20} y={height * 0.3} width={100} height={50} rx={12} fill="#FFFFFF" opacity={0.08} />
    <Rect x={width - 120} y={height * 0.32} width={100} height={50} rx={12} fill="#FFFFFF" opacity={0.08} />
    <Circle cx={width * 0.35} cy={height * 0.45} r={6} fill="#2D6BE4" opacity={0.5} />
    <Circle cx={width * 0.65} cy={height * 0.42} r={8} fill="#2D6BE4" opacity={0.4} />
    <Rect x={width * 0.42} y={height * 0.48} width={width * 0.16} height={4} rx={2} fill="#FFFFFF" opacity={0.2} />
  </Svg>
);

const Slide2Illustration = () => (
  <Svg width={width} height={height * 0.55} viewBox={`0 0 ${width} ${height * 0.55}`}>
    {/* CV/Document shape */}
    <Rect x={width * 0.2} y={40} width={width * 0.6} height={height * 0.4} rx={16} fill="#F5F7FA" />
    <Rect x={width * 0.2} y={40} width={width * 0.6} height={60} rx={16} fill="#1A3A6B" />
    <Circle cx={width * 0.3} cy={70} r={20} fill="#FFFFFF" opacity={0.9} />
    <Rect x={width * 0.35} y={58} width={100} height={10} rx={5} fill="#FFFFFF" opacity={0.9} />
    <Rect x={width * 0.35} y={74} width={70} height={8} rx={4} fill="#FFFFFF" opacity={0.5} />
    {/* CV content lines */}
    <Rect x={width * 0.25} y={120} width={width * 0.5} height={8} rx={4} fill="#E2E8F0" />
    <Rect x={width * 0.25} y={138} width={width * 0.4} height={8} rx={4} fill="#E2E8F0" />
    <Rect x={width * 0.25} y={166} width={60} height={8} rx={4} fill="#2D6BE4" opacity={0.7} />
    <Rect x={width * 0.25} y={184} width={width * 0.5} height={6} rx={3} fill="#E2E8F0" />
    <Rect x={width * 0.25} y={198} width={width * 0.35} height={6} rx={3} fill="#E2E8F0" />
    <Rect x={width * 0.25} y={226} width={60} height={8} rx={4} fill="#2D6BE4" opacity={0.7} />
    <Rect x={width * 0.25} y={244} width={width * 0.5} height={6} rx={3} fill="#E2E8F0" />
    <Rect x={width * 0.25} y={258} width={width * 0.3} height={6} rx={3} fill="#E2E8F0" />
    {/* AI badge */}
    <Rect x={width * 0.55} y={300} width={100} height={32} rx={16} fill="#1A3A6B" />
    <Path d="M 0 0 L 6 10 L 12 0 Z" fill="#FFFFFF" transform={`translate(${width * 0.575}, 310)`} />
    <Rect x={width * 0.61} y={308} width={40} height={6} rx={3} fill="#FFFFFF" opacity={0.9} />
    {/* Floating accent dots */}
    <Circle cx={width * 0.12} cy={120} r={14} fill="#E8F0FE" />
    <Circle cx={width * 0.88} cy={200} r={10} fill="#2D6BE4" opacity={0.2} />
    <Circle cx={width * 0.85} cy={100} r={20} fill="#E8F0FE" />
  </Svg>
);

const Slide3Illustration = () => (
  <Svg width={width} height={height * 0.55} viewBox={`0 0 ${width} ${height * 0.55}`}>
    {/* Interview chat bubbles */}
    <Rect x={width * 0.08} y={60} width={width * 0.6} height={70} rx={16} fill="#1A3A6B" />
    <Path d={`M ${width * 0.12} 130 L ${width * 0.08} 145 L ${width * 0.22} 130 Z`} fill="#1A3A6B" />
    <Rect x={width * 0.15} y={78} width={width * 0.46} height={8} rx={4} fill="#FFFFFF" opacity={0.9} />
    <Rect x={width * 0.15} y={94} width={width * 0.36} height={8} rx={4} fill="#FFFFFF" opacity={0.6} />
    <Rect x={width * 0.15} y={110} width={width * 0.42} height={8} rx={4} fill="#FFFFFF" opacity={0.4} />
    {/* Reply bubble */}
    <Rect x={width * 0.28} y={165} width={width * 0.62} height={70} rx={16} fill="#FFFFFF" />
    <Rect x={width * 0.28} y={165} width={width * 0.62} height={70} rx={16} fill="none" stroke="#E2E8F0" strokeWidth={1.5} />
    <Path d={`M ${width * 0.86} 235 L ${width * 0.9} 250 L ${width * 0.78} 235 Z`} fill="#FFFFFF" stroke="#E2E8F0" strokeWidth={1.5} />
    <Rect x={width * 0.34} y={183} width={width * 0.46} height={8} rx={4} fill="#8A9BB0" />
    <Rect x={width * 0.34} y={199} width={width * 0.36} height={8} rx={4} fill="#8A9BB0" />
    <Rect x={width * 0.34} y={215} width={width * 0.3} height={8} rx={4} fill="#8A9BB0" />
    {/* Score badge */}
    <Circle cx={width * 0.8} cy={310} r={40} fill="#22C55E" opacity={0.15} />
    <Circle cx={width * 0.8} cy={310} r={28} fill="#22C55E" />
    <Rect x={width * 0.765} y={302} width={30} height={6} rx={3} fill="#FFFFFF" />
    <Rect x={width * 0.765} y={314} width={20} height={6} rx={3} fill="#FFFFFF" opacity={0.7} />
    {/* Mic icon */}
    <Circle cx={width * 0.2} cy={310} r={30} fill="#E8F0FE" />
    <Rect x={width * 0.178} y={295} width={16} height={22} rx={8} fill="#2D6BE4" />
    <Path d={`M ${width * 0.168} 320 Q ${width * 0.2} 335 ${width * 0.232} 320`} fill="none" stroke="#2D6BE4" strokeWidth={2} />
    <Rect x={width * 0.196} y={333} width={2} height={8} fill="#2D6BE4" />
  </Svg>
);

const slides = [
  {
    id: '1',
    title: 'Your Internship,\nYour Future',
    subtitle: 'Discover SIWES and internship opportunities tailored to your department and skill set.',
    background: ['#1A3A6B', '#0D2348'] as const,
    titleColor: '#FFFFFF',
    subtitleColor: 'rgba(255,255,255,0.75)',
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
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
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
      <LinearGradient
        colors={currentSlide.background}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Illustration Area */}
      <View style={styles.illustrationContainer}>
        <Animated.FlatList
          ref={flatListRef}
          data={slides}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          renderItem={({ item }) => (
            <View style={{ width }}>
              {item.illustration}
            </View>
          )}
        />
      </View>

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
        <Text style={[styles.title, { color: currentSlide.titleColor }]}>
          {currentSlide.title}
        </Text>
        <Text style={[styles.subtitle, { color: currentSlide.subtitleColor }]}>
          {currentSlide.subtitle}
        </Text>

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
