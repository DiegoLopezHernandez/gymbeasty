import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ViewStyle, ActivityIndicator, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppTheme, Radius, Spacing, getShadow } from '../constants/theme';
import { useThemeStore } from '../store/themeStore';

export const useTheme = () => useThemeStore(s => s.theme);

export const GridBackground: React.FC<{ theme: AppTheme; style?: ViewStyle }> = ({ theme, style }) => (
  <View style={[StyleSheet.absoluteFillObject, style]} pointerEvents="none">
    {Array.from({ length: 8 }).map((_, i) => (
      <View key={`h${i}`} style={{
        position: 'absolute', left: 0, right: 0, top: i * 52, height: 1,
        backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.04)',
      }} />
    ))}
  </View>
);

export const AccentStripe: React.FC<{ theme: AppTheme; style?: ViewStyle }> = ({ theme, style }) => (
  <LinearGradient colors={[theme.primary, theme.secondary]}
    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
    style={[{ height: 3, borderRadius: 2 }, style]} />
);

export const Card: React.FC<{
  children: React.ReactNode; style?: ViewStyle;
  onPress?: () => void; glow?: boolean; accent?: boolean;
}> = ({ children, style, onPress, glow, accent }) => {
  const theme = useTheme();
  const inner = (
    <View style={[{
      backgroundColor: theme.bgCard, borderRadius: Radius.lg,
      padding: Spacing.md, borderWidth: 1, marginBottom: Spacing.sm,
      borderColor: glow ? theme.borderAccent : theme.border,
      overflow: 'hidden', ...getShadow(theme, glow ? 'glow' : 'card'),
    }, style]}>
      {accent && <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0,
        width: 3, backgroundColor: theme.primary,
        borderTopLeftRadius: Radius.lg, borderBottomLeftRadius: Radius.lg }} />}
      {children}
    </View>
  );
  return onPress
    ? <TouchableOpacity onPress={onPress} activeOpacity={0.82}>{inner}</TouchableOpacity>
    : inner;
};

export const Button: React.FC<{
  title: string; onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg'; disabled?: boolean; loading?: boolean;
  style?: ViewStyle; fullWidth?: boolean; icon?: string;
}> = ({ title, onPress, variant = 'primary', size = 'md', disabled, loading, style, fullWidth, icon }) => {
  const theme = useTheme();
  const pad = size === 'sm' ? { v: 9, h: 16 } : size === 'lg' ? { v: 16, h: 28 } : { v: 13, h: 22 };
  const fontSize = size === 'sm' ? 12 : size === 'lg' ? 16 : 14;

  const Inner = ({ children }: { children: React.ReactNode }) => {
    if (variant === 'primary' && !disabled) {
      return (
        <LinearGradient colors={[theme.primaryLight, theme.primary]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[{ borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center',
            paddingVertical: pad.v, paddingHorizontal: pad.h },
            fullWidth && { width: '100%' as any }, style]}>
          {children}
        </LinearGradient>
      );
    }
    const bg = variant === 'ghost' ? 'transparent'
      : variant === 'danger' ? theme.dangerSubtle
      : variant === 'success' ? theme.successSubtle
      : variant === 'secondary' ? theme.secondarySubtle
      : theme.bgElevated;
    return (
      <View style={[{ borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center',
        paddingVertical: pad.v, paddingHorizontal: pad.h, backgroundColor: bg,
        borderWidth: variant === 'ghost' ? 1 : 0, borderColor: theme.border },
        fullWidth && { width: '100%' as any }, disabled && { opacity: 0.4 }, style]}>
        {children}
      </View>
    );
  };

  const textColor = variant === 'primary' ? '#fff'
    : variant === 'danger' ? theme.danger
    : variant === 'success' ? theme.success
    : variant === 'secondary' ? theme.secondary
    : theme.textSecondary;

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.8}>
      <Inner>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {icon && <Text style={{ fontSize: fontSize + 2 }}>{icon}</Text>}
          {loading
            ? <ActivityIndicator size="small" color={textColor} />
            : <Text style={{ color: textColor, fontSize, fontWeight: '700', letterSpacing: 0.3 }}>{title}</Text>}
        </View>
      </Inner>
    </TouchableOpacity>
  );
};

export const Badge: React.FC<{ label: string; color?: string; style?: ViewStyle; size?: 'sm' | 'md' }> = ({ label, color, style, size = 'sm' }) => {
  const theme = useTheme();
  const c = color || theme.primary;
  return (
    <View style={[{ paddingHorizontal: size === 'sm' ? 8 : 12, paddingVertical: size === 'sm' ? 3 : 5,
      borderRadius: Radius.full, backgroundColor: c + '18', borderWidth: 1, borderColor: c + '40',
      alignSelf: 'flex-start' }, style]}>
      <Text style={{ color: c, fontSize: size === 'sm' ? 10 : 12, fontWeight: '700', letterSpacing: 0.4 }}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
};

export const SectionHeader: React.FC<{
  title: string; subtitle?: string;
  action?: { label: string; onPress: () => void }; style?: ViewStyle;
}> = ({ title, subtitle, action, style }) => {
  const theme = useTheme();
  return (
    <View style={[{ marginBottom: Spacing.md }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <View style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: theme.primary }} />
            <Text style={{ color: theme.textPrimary, fontSize: 17, fontWeight: '800', letterSpacing: -0.2 }}>{title}</Text>
          </View>
          {subtitle && <Text style={{ color: theme.textMuted, fontSize: 11, marginLeft: 11 }}>{subtitle}</Text>}
        </View>
        {action && (
          <TouchableOpacity onPress={action.onPress}>
            <Text style={{ color: theme.primary, fontSize: 13, fontWeight: '600' }}>{action.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export const StatBox: React.FC<{
  value: string; label: string; color?: string; style?: ViewStyle; icon?: string;
}> = ({ value, label, color, style, icon }) => {
  const theme = useTheme();
  const c = color || theme.primary;
  return (
    <View style={[{ flex: 1, alignItems: 'center', padding: Spacing.sm,
      borderRightWidth: 1, borderRightColor: theme.border }, style]}>
      {icon && <Text style={{ fontSize: 18, marginBottom: 2 }}>{icon}</Text>}
      <Text style={{ color: c, fontSize: 22, fontWeight: '900', letterSpacing: -0.5 }}>{value}</Text>
      <Text style={{ color: theme.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.8,
        textTransform: 'uppercase', marginTop: 2 }}>{label}</Text>
    </View>
  );
};

export const EmptyState: React.FC<{
  icon: string; title: string; subtitle?: string;
  action?: { label: string; onPress: () => void };
}> = ({ icon, title, subtitle, action }) => {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center', padding: Spacing.xxl }}>
      <Text style={{ fontSize: 52, marginBottom: Spacing.md }}>{icon}</Text>
      <Text style={{ color: theme.textPrimary, fontSize: 17, fontWeight: '700', textAlign: 'center' }}>{title}</Text>
      {subtitle && <Text style={{ color: theme.textSecondary, fontSize: 13, textAlign: 'center',
        marginTop: 8, lineHeight: 20 }}>{subtitle}</Text>}
      {action && <Button title={action.label} onPress={action.onPress} style={{ marginTop: 20 }} />}
    </View>
  );
};

export const ProgressBar: React.FC<{
  progress: number; color?: string; height?: number; style?: ViewStyle; gradient?: boolean;
}> = ({ progress, color, height = 6, style, gradient }) => {
  const theme = useTheme();
  const c = color || theme.primary;
  const pct = Math.min(100, Math.max(0, progress * 100));
  return (
    <View style={[{ height, backgroundColor: theme.bgSunken, borderRadius: Radius.full,
      overflow: 'hidden', borderWidth: 1, borderColor: theme.border }, style]}>
      {gradient
        ? <LinearGradient colors={[theme.primaryLight, c]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ width: `${pct}%` as any, height, borderRadius: Radius.full }} />
        : <View style={{ width: `${pct}%` as any, height, backgroundColor: c, borderRadius: Radius.full }} />}
    </View>
  );
};

export const Divider: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const theme = useTheme();
  return <View style={[{ height: 1, backgroundColor: theme.border, marginVertical: Spacing.md }, style]} />;
};

export const PillSelector: React.FC<{
  options: { value: string; label: string }[]; value: string;
  onChange: (v: string) => void; style?: ViewStyle;
}> = ({ options, value, onChange, style }) => {
  const theme = useTheme();
  return (
    <View style={[{ flexDirection: 'row', backgroundColor: theme.bgSunken, borderRadius: Radius.md,
      padding: 3, gap: 2, borderWidth: 1, borderColor: theme.border }, style]}>
      {options.map(opt => (
        <TouchableOpacity key={opt.value} style={{ flex: 1, paddingVertical: 7, paddingHorizontal: 10,
          borderRadius: Radius.sm - 2,
          backgroundColor: value === opt.value ? theme.bgCard : 'transparent',
          borderWidth: value === opt.value ? 1 : 0,
          borderColor: value === opt.value ? theme.primary + '40' : 'transparent' }}
          onPress={() => onChange(opt.value)}>
          <Text style={{ color: value === opt.value ? theme.primary : theme.textMuted,
            fontSize: 12, fontWeight: '700', textAlign: 'center', letterSpacing: 0.3 }}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Simple bar chart - no external lib needed
export const SimpleBarChart: React.FC<{
  data: { label: string; value: number }[];
  color?: string; height?: number; suffix?: string;
}> = ({ data, color, height = 160, suffix = '' }) => {
  const theme = useTheme();
  const c = color || theme.primary;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  return (
    <View style={{ height, flexDirection: 'row', alignItems: 'flex-end',
      gap: 4, paddingHorizontal: 4, paddingBottom: 24 }}>
      {data.map((d, i) => {
        const barH = Math.max(4, ((d.value / maxVal) * (height - 40)));
        return (
          <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
            {d.value > 0 && (
              <Text style={{ color: theme.textMuted, fontSize: 8, marginBottom: 2 }}>
                {d.value > 999 ? `${(d.value/1000).toFixed(1)}k` : d.value}{suffix}
              </Text>
            )}
            <LinearGradient colors={[c, c + '66']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
              style={{ width: '100%', height: barH, borderRadius: 4, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
            <Text style={{ color: theme.textMuted, fontSize: 8, marginTop: 4, textAlign: 'center' }}
              numberOfLines={1}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
};
