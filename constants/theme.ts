export const Typography = {
  // Fraunces — display only
  display: {
    fontFamily: 'Fraunces_900Black',
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  displayLg: {
    fontFamily: 'Fraunces_900Black',
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -1,
  },
  displaySm: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  },

  // DM Sans — all other text
  h1: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  h2: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  h3: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 18,
    lineHeight: 26,
  },
  bodyLg: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  body: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    lineHeight: 22,
  },
  bodySemiBold: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    lineHeight: 22,
  },
  label: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  labelSemiBold: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    lineHeight: 18,
  },
  micro: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    lineHeight: 16,
  },
  button: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  buttonSm: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 40,
};

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 50,
  card: 16,
  button: 12,
  chip: 50,
};

export const Shadows = {
  // Only use on floating elements
  float: {
    shadowColor: '#0D1B2A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  card: {
    shadowColor: '#0D1B2A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
};
