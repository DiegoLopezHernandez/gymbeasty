// ─── GymBeast Theme System ────────────────────────────────────────────────────
export type ThemeMode = 'dark' | 'light';

export interface AppTheme {
  mode: ThemeMode;
  bg: string;
  bgCard: string;
  bgElevated: string;
  bgSunken: string;
  bgOverlay: string;
  border: string;
  borderStrong: string;
  borderAccent: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryGlow: string;
  primarySubtle: string;
  secondary: string;
  secondaryGlow: string;
  secondarySubtle: string;
  success: string;
  successSubtle: string;
  warning: string;
  warningSubtle: string;
  danger: string;
  dangerSubtle: string;
  muscleAchieved: string;
  muscleClose: string;
  muscleProgressing: string;
  muscleFar: string;
  muscleNone: string;
  tabBg: string;
  tabBorder: string;
  tabActive: string;
  tabInactive: string;
}

export const DarkTheme: AppTheme = {
  mode: 'dark',
  bg: '#181B20',
  bgCard: '#22252C',
  bgElevated: '#2A2E37',
  bgSunken: '#14161A',
  bgOverlay: 'rgba(10,12,16,0.88)',
  border: '#2E3240',
  borderStrong: '#3D4257',
  borderAccent: 'rgba(255,80,20,0.35)',
  textPrimary: '#EEF0F5',
  textSecondary: '#8A8FA8',
  textMuted: '#4A4F66',
  textInverse: '#111318',
  primary: '#FF5014',
  primaryLight: '#FF7A45',
  primaryDark: '#CC3A0A',
  primaryGlow: 'rgba(255,80,20,0.18)',
  primarySubtle: 'rgba(255,80,20,0.08)',
  secondary: '#00D4FF',
  secondaryGlow: 'rgba(0,212,255,0.15)',
  secondarySubtle: 'rgba(0,212,255,0.08)',
  success: '#00E87A',
  successSubtle: 'rgba(0,232,122,0.1)',
  warning: '#FFB800',
  warningSubtle: 'rgba(255,184,0,0.1)',
  danger: '#FF2D55',
  dangerSubtle: 'rgba(255,45,85,0.1)',
  muscleAchieved: '#FF2D55',
  muscleClose: '#FF6900',
  muscleProgressing: '#FFB800',
  muscleFar: '#00E87A',
  muscleNone: '#2E3240',
  tabBg: '#1D2028',
  tabBorder: '#2A2E3A',
  tabActive: '#FF5014',
  tabInactive: '#4A4F66',
};

export const LightTheme: AppTheme = {
  mode: 'light',
  bg: '#ECEAE5',
  bgCard: '#F7F5F0',
  bgElevated: '#FDFCFA',
  bgSunken: '#E0DDD7',
  bgOverlay: 'rgba(30,28,25,0.75)',
  border: '#D4D0C8',
  borderStrong: '#B8B3A8',
  borderAccent: 'rgba(220,60,10,0.3)',
  textPrimary: '#1A1814',
  textSecondary: '#5A5650',
  textMuted: '#9A9590',
  textInverse: '#F7F5F0',
  primary: '#DC3C0A',
  primaryLight: '#F55020',
  primaryDark: '#A82C05',
  primaryGlow: 'rgba(220,60,10,0.15)',
  primarySubtle: 'rgba(220,60,10,0.07)',
  secondary: '#0096BB',
  secondaryGlow: 'rgba(0,150,187,0.15)',
  secondarySubtle: 'rgba(0,150,187,0.07)',
  success: '#00A855',
  successSubtle: 'rgba(0,168,85,0.1)',
  warning: '#D48000',
  warningSubtle: 'rgba(212,128,0,0.1)',
  danger: '#D4203A',
  dangerSubtle: 'rgba(212,32,58,0.1)',
  muscleAchieved: '#D4203A',
  muscleClose: '#E05500',
  muscleProgressing: '#D48000',
  muscleFar: '#00A855',
  muscleNone: '#C8C4BC',
  tabBg: '#F0EDE8',
  tabBorder: '#D4D0C8',
  tabActive: '#DC3C0A',
  tabInactive: '#9A9590',
};

export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const Radius = { xs: 4, sm: 8, md: 12, lg: 16, xl: 22, full: 999 } as const;

export const getShadow = (theme: AppTheme, variant: 'card' | 'glow' = 'card') => {
  if (variant === 'glow') return {
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: theme.mode === 'dark' ? 0.45 : 0.25,
    shadowRadius: 14,
    elevation: 10,
  };
  return {
    shadowColor: theme.mode === 'dark' ? '#000' : '#1A1814',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: theme.mode === 'dark' ? 0.35 : 0.1,
    shadowRadius: 8,
    elevation: 5,
  };
};
