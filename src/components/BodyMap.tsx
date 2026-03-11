/**
 * BodyMap HUD — mapa muscular estilo videojuego
 * Dos columnas lado a lado (frontal / posterior)
 * Cada músculo = bloque con forma anatómica + gradiente + glow
 */
import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from './ui';
import { Radius } from '../constants/theme';

export type MapMuscle =
  'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' |
  'quads' | 'hamstrings' | 'glutes' | 'abs' | 'calves';

export const MUSCLE_LABELS: Record<MapMuscle, string> = {
  chest: 'Pecho',      back: 'Espalda',    shoulders: 'Hombros',
  biceps: 'Bíceps',   triceps: 'Tríceps', quads: 'Cuádriceps',
  hamstrings: 'Femoral', glutes: 'Glúteos', abs: 'Abdomen', calves: 'Gemelos',
};

const MUSCLE_EMOJI: Record<MapMuscle, string> = {
  chest: '🫁', back: '🔙', shoulders: '🏈',
  biceps: '💪', triceps: '🦾', quads: '🦵',
  hamstrings: '🦿', glutes: '🍑', abs: '⬡', calves: '🦶',
};

// Each zone: height and border-radius shape to suggest anatomy
interface ZoneDef { key: MapMuscle; h: number; w: number; topR: number; botR: number }

const FRONT_ZONES: ZoneDef[] = [
  { key: 'shoulders',  h: 34, w: 1.0, topR: 99, botR: 8  },  // arch
  { key: 'chest',      h: 44, w: 0.9, topR: 22, botR: 10 },  // rounded wide
  { key: 'biceps',     h: 28, w: 0.85,topR: 99, botR: 99 },  // pill
  { key: 'abs',        h: 54, w: 0.6, topR: 6,  botR: 14 },  // rectangle
  { key: 'quads',      h: 36, w: 0.95,topR: 10, botR: 22 },  // inverted arch
];

const BACK_ZONES: ZoneDef[] = [
  { key: 'back',       h: 58, w: 0.95,topR: 22, botR: 8  },  // wing
  { key: 'triceps',    h: 28, w: 0.85,topR: 99, botR: 99 },  // pill
  { key: 'glutes',     h: 40, w: 0.9, topR: 99, botR: 10 },  // dome
  { key: 'hamstrings', h: 36, w: 0.92,topR: 10, botR: 22 },
  { key: 'calves',     h: 26, w: 0.65,topR: 99, botR: 99 },
];

interface BlockProps {
  def: ZoneDef;
  color: string;
  isSelected: boolean;
  isNeutral: boolean;
  colW: number;
  onPress: () => void;
}

const MuscleBlock: React.FC<BlockProps> = ({ def, color, isSelected, isNeutral, colW, onPress }) => {
  const theme = useTheme();
  const w = (colW - 8) * def.w;
  const marginH = ((colW - 8) - w) / 2;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        width: w, height: def.h,
        marginHorizontal: marginH, marginBottom: 5,
        borderTopLeftRadius: def.topR, borderTopRightRadius: def.topR,
        borderBottomLeftRadius: def.botR, borderBottomRightRadius: def.botR,
        overflow: 'hidden',
        borderWidth: isSelected ? 2 : 1,
        borderColor: isSelected ? '#fff' : (isNeutral ? theme.border : color + '80'),
        // glow via shadow
        shadowColor: isSelected ? '#fff' : (isNeutral ? 'transparent' : color),
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: isSelected ? 1 : (isNeutral ? 0 : 0.55),
        shadowRadius: isSelected ? 10 : 5,
        elevation: isSelected ? 10 : (isNeutral ? 1 : 4),
      }}
    >
      <LinearGradient
        colors={isNeutral
          ? [theme.mode === 'dark' ? '#252A36' : '#CCCAC0', theme.mode === 'dark' ? '#1E2230' : '#B8B5AA']
          : [color + 'EE', color + '77']
        }
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 4 }}
      >
        <Text style={{ fontSize: def.h > 40 ? 14 : 11, opacity: isNeutral ? 0.4 : 0.95 }}>
          {MUSCLE_EMOJI[def.key]}
        </Text>
        <Text
          style={{ color: isNeutral ? (theme.mode === 'dark' ? '#55607A' : '#888') : '#fff', fontSize: def.h > 40 ? 10 : 9, fontWeight: '800', letterSpacing: 0.3 }}
          numberOfLines={1}
        >
          {MUSCLE_LABELS[def.key].toUpperCase()}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

interface Props {
  getColor: (k: MapMuscle) => string;
  selectedMuscle: MapMuscle | null;
  onPress: (k: MapMuscle) => void;
}

export const BodyMapDualHUD: React.FC<Props> = ({ getColor, selectedMuscle, onPress }) => {
  const theme = useTheme();
  const { width: SW } = Dimensions.get('window');
  const colW = (SW - 48) / 2;   // two columns + gap
  const neutral = theme.mode === 'dark' ? '#3A3F52' : '#C8C4BC';

  const renderCol = (side: 'front' | 'back', zones: ZoneDef[]) => (
    <View style={{
      width: colW,
      backgroundColor: theme.bgCard,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 4,
      paddingTop: 8,
    }}>
      {/* Column header */}
      <View style={{ alignItems: 'center', marginBottom: 8, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>
          {side === 'front' ? '👤  FRONTAL' : '🔄  POSTERIOR'}
        </Text>
      </View>

      {zones.map(def => {
        const col = getColor(def.key);
        return (
          <MuscleBlock
            key={def.key}
            def={def}
            color={col}
            isSelected={selectedMuscle === def.key}
            isNeutral={col === neutral}
            colW={colW}
            onPress={() => onPress(def.key)}
          />
        );
      })}
    </View>
  );

  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {renderCol('front', FRONT_ZONES)}
      {renderCol('back',  BACK_ZONES)}
    </View>
  );
};
