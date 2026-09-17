// HydroSmart Design System — The single source of truth for all colors, fonts, spacing

export const Colors = {
  // Backgrounds
  bg: '#0A1628',         // Deep Navy
  bgSecondary: '#0D2137', // Slightly lighter navy
  bgCard: '#0F2A3D',      // Card background

  // Glass effect
  glass: 'rgba(255, 255, 255, 0.07)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  glassStrong: 'rgba(255, 255, 255, 0.12)',

  // Primary palette
  primary: '#00D4FF',    // Cyan
  primaryDark: '#00A8D6',
  secondary: '#00B4D8',  // Teal
  accent: '#7B2FBE',     // Purple (streaks)

  // Status
  success: '#00E676',    // Green — goal complete!
  warning: '#FFB300',    // Amber — behind pace
  danger: '#FF4444',     // Red — critical

  // Text
  text: '#FFFFFF',
  textMuted: '#A8B8D0',
  textDim: '#5A7A9A',

  // UI elements
  separator: 'rgba(255,255,255,0.08)',
  tabBar: '#0B1D30',
  tabBarBorder: 'rgba(0, 212, 255, 0.15)',
};

export const Gradients = {
  primary: ['#00D4FF', '#00B4D8', '#0080A8'],
  bg: ['#0A1628', '#0D2137', '#0A1628'],
  card: ['rgba(0, 212, 255, 0.08)', 'rgba(0, 180, 216, 0.04)'],
  success: ['#00E676', '#00C853'],
  warning: ['#FFB300', '#FF8F00'],
  danger: ['#FF4444', '#CC0000'],
  purple: ['#7B2FBE', '#4A1A8E'],
};

export const Fonts = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_500Medium',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
};

export const Shadows = {
  cyan: {
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
};

// Container sizes for quick log
export const CONTAINERS = [
  { id: '1', label: 'Chhota Glass', ml: 150, iconName: 'cafe-outline' },
  { id: '2', label: '1 Glass', ml: 250, iconName: 'wine-outline' },
  { id: '3', label: 'Bada Glass', ml: 350, iconName: 'pint-outline' },
  { id: '4', label: 'Bottle', ml: 500, iconName: 'water-outline' },
  { id: '5', label: 'Badi Bottle', ml: 750, iconName: 'flask-outline' },
  { id: '6', label: '1 Liter', ml: 1000, iconName: 'beaker-outline' },
];
