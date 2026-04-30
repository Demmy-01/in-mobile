// MIMS Brand Color System
export const Colors = {
  light: {
    // Primary Palette
    primaryBlue: '#1A3A6B',
    accentBlue: '#2D6BE4',
    lightBlue: '#E8F0FE',

    // Neutrals
    white: '#FFFFFF',
    surfaceGrey: '#F5F7FA',
    textDark: '#0D1B2A',
    textMuted: '#8A9BB0',

    // Semantic
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',

    // UI
    background: '#FFFFFF',
    surface: '#F5F7FA',
    border: '#E2E8F0',
    borderLight: '#EEF2F7',
    card: '#FFFFFF',
    cardBorder: '#E2E8F0',
    inputBg: '#F5F7FA',
    inputBorder: '#DDE3EC',
    placeholder: '#8A9BB0',
    divider: '#EEF2F7',
    overlay: 'rgba(13, 27, 42, 0.5)',

    // Gradients (used as array pairs)
    heroGradientStart: '#1A3A6B',
    heroGradientEnd: '#2D6BE4',

    // Tab bar
    tabActive: '#2D6BE4',
    tabInactive: '#8A9BB0',
    tabBackground: '#FFFFFF',
  },
  dark: {
    primaryBlue: '#2D6BE4',
    accentBlue: '#5B8FF0',
    lightBlue: '#1A2D4F',

    white: '#FFFFFF',
    surfaceGrey: '#1A1F2E',
    textDark: '#F0F4FF',
    textMuted: '#6B7A96',

    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',

    background: '#0D1117',
    surface: '#161B27',
    border: '#252D3D',
    borderLight: '#1E2635',
    card: '#161B27',
    cardBorder: '#252D3D',
    inputBg: '#1A1F2E',
    inputBorder: '#2A3347',
    placeholder: '#6B7A96',
    divider: '#1E2635',
    overlay: 'rgba(0, 0, 0, 0.7)',

    heroGradientStart: '#0D1B2A',
    heroGradientEnd: '#1A3A6B',

    tabActive: '#2D6BE4',
    tabInactive: '#6B7A96',
    tabBackground: '#0D1117',
  },
};

export type ColorScheme = keyof typeof Colors;
export type ThemeColors = typeof Colors.light;
