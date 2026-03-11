import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Modal, TextInput, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Ellipse, G, Rect, Circle, Text as SvgText } from 'react-native-svg';
import { useGymStore } from '../../src/store/gymStore';
import { Button, Badge, SectionHeader, EmptyState, ProgressBar, useTheme } from '../../src/components/ui';
import { Spacing, Radius } from '../../src/constants/theme';
import { generateId } from '../../src/utils/calculations';
import { Goal, MuscleGroup } from '../../src/types';

const { width: SW } = Dimensions.get('window');

// ── Muscle zones on a simplified body (viewBox 0 0 200 400) ─────────────────
// Each zone has: key, label, front/back, path/ellipse params, tap area
const FRONT_MUSCLES = [
  { key: 'shoulders', label: 'Hombros',     cx: 100, cy: 108, rx: 56, ry: 14, shape: 'ellipse' as const },
  { key: 'chest',     label: 'Pecho',        cx: 100, cy: 130, rx: 36, ry: 20, shape: 'ellipse' as const },
  { key: 'biceps',    label: 'Bíceps',       cx: 100, cy: 155, rx: 50, ry: 10, shape: 'ellipse' as const },
  { key: 'abs',       label: 'Abdomen',      cx: 100, cy: 168, rx: 22, ry: 22, shape: 'ellipse' as const },
  { key: 'quads',     label: 'Cuádriceps',   cx: 100, cy: 282, rx: 40, ry: 36, shape: 'ellipse' as const },
];
const BACK_MUSCLES = [
  { key: 'back',       label: 'Espalda',   cx: 100, cy: 128, rx: 36, ry: 24, shape: 'ellipse' as const },
  { key: 'triceps',    label: 'Tríceps',   cx: 100, cy: 155, rx: 50, ry: 10, shape: 'ellipse' as const },
  { key: 'glutes',     label: 'Glúteos',   cx: 100, cy: 210, rx: 32, ry: 18, shape: 'ellipse' as const },
  { key: 'hamstrings', label: 'Femoral',   cx: 100, cy: 282, rx: 40, ry: 32, shape: 'ellipse' as const },
];

// Simplified human body silhouette paths (front/back same shape)
const BODY_PATH = `
  M100,30 C92,30 85,36 85,44 C85,52 90,58 92,62
  L88,72 C80,74 72,80 68,90 C64,100 64,114 64,114
  L54,116 C48,120 46,130 46,138 L46,172 C46,176 48,178 50,178 L54,170
  L54,220 C54,228 50,236 50,248 L52,310 C52,316 56,320 62,320
  L68,320 C74,320 78,314 76,306 L72,248 C76,230 80,220 100,218
  C120,220 124,230 128,248 L124,306 C122,314 126,320 132,320
  L138,320 C144,320 148,316 148,310 L150,248 C150,236 146,228 146,220
  L146,170 L150,178 C152,178 154,176 154,172 L154,138
  C154,130 152,120 146,116 L136,114 C136,114 136,100 132,90
  C128,80 120,74 112,72 L108,62 C110,58 115,52 115,44
  C115,36 108,30 100,30 Z
`;

const MUSCLE_LABELS: Record<string, string> = {
  chest:'Pecho', back:'Espalda', shoulders:'Hombros', biceps:'Bíceps', triceps:'Tríceps',
  quads:'Cuádriceps', hamstrings:'Femoral', glutes:'Glúteos', abs:'Abdomen',
  lats:'Dorsales', traps:'Trapecios', calves:'Gemelos', forearms:'Antebrazos',
};
const GOAL_MUSCLES = Object.keys(MUSCLE_LABELS);

export default function GoalsScreen() {
  const theme = useTheme();
  const { goals, addGoal, updateGoal, deleteGoal, getMuscleFrequency, getMuscleStats } = useGymStore();
  const [view, setView] = useState<'front' | 'back'>('front');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [title, setTitle] = useState('');
  const [targetVal, setTargetVal] = useState('');
  const [currentVal, setCurrentVal] = useState('0');
  const [muscle, setMuscle] = useState<string>('chest');

  const freqWeek = getMuscleFrequency(7);
  const freqMonth = getMuscleFrequency(30);
  const muscles = view === 'front' ? FRONT_MUSCLES : BACK_MUSCLES;

  // Determine muscle zone color
  const getMuscleColor = (key: string) => {
    const goal = goals.find(g => g.muscleGroup === key && !g.completedAt);
    if (goal) {
      const pct = Math.min(1, goal.currentValue / goal.targetValue);
      if (pct >= 1)   return theme.success;
      if (pct >= 0.7) return theme.warning;
      if (pct >= 0.3) return theme.primary;
      return theme.primary + '88';
    }
    if (freqWeek[key] && freqWeek[key] > 0) return theme.secondary;
    return theme.mode === 'dark' ? '#3A3F52' : '#C8C4BC';
  };

  const muscleStats = selectedMuscle ? getMuscleStats(selectedMuscle) : null;
  const selectedGoal = selectedMuscle ? goals.find(g => g.muscleGroup === selectedMuscle && !g.completedAt) : null;

  const openNew = (m?: string) => {
    setEditing(null); setTitle(''); setTargetVal(''); setCurrentVal('0');
    setMuscle(m || 'chest'); setShowGoalModal(true);
  };
  const openEdit = (g: Goal) => {
    setEditing(g); setTitle(g.title); setTargetVal(String(g.targetValue));
    setCurrentVal(String(g.currentValue)); setMuscle(g.muscleGroup || 'chest'); setShowGoalModal(true);
  };
  const save = () => {
    if (!title.trim() || !targetVal) return;
    const data = { title: title.trim(), targetValue: Number(targetVal), currentValue: Number(currentVal), unit: 'kg', muscleGroup: muscle as MuscleGroup, type: 'weight_lift' as const };
    if (editing) updateGoal(editing.id, data);
    else addGoal({ id: generateId(), ...data, createdAt: new Date().toISOString() });
    setShowGoalModal(false);
  };

  const mapW = SW - 32;
  const mapH = mapW * 2.1;
  const scale = mapW / 200;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <LinearGradient colors={theme.mode === 'dark' ? ['#001A1A','#181B20'] : ['#E0F5F5','#ECEAE5']}
        style={{ paddingTop: 56, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md }}>
        <Text style={{ color: theme.textPrimary, fontSize: 28, fontWeight: '900', letterSpacing: -1 }}>Mapa Muscular</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 3 }}>Toca un músculo para ver estadísticas</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {/* Front/Back toggle */}
        <View style={{ flexDirection: 'row', margin: Spacing.md, backgroundColor: theme.bgElevated, borderRadius: Radius.md, padding: 3, gap: 3, borderWidth: 1, borderColor: theme.border }}>
          {(['front','back'] as const).map(v => (
            <TouchableOpacity key={v} onPress={() => setView(v)}
              style={{ flex: 1, paddingVertical: 9, borderRadius: Radius.sm - 2, alignItems: 'center', backgroundColor: view === v ? theme.bgCard : 'transparent', borderWidth: view === v ? 1 : 0, borderColor: view === v ? theme.primary + '40' : 'transparent' }}>
              <Text style={{ color: view === v ? theme.primary : theme.textMuted, fontSize: 13, fontWeight: '700' }}>
                {v === 'front' ? '👤 Frontal' : '🔄 Posterior'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Body map */}
        <View style={{ marginHorizontal: Spacing.md, backgroundColor: theme.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: theme.border, overflow: 'hidden', alignItems: 'center', paddingVertical: 16 }}>
          <Svg width={mapW * 0.55} height={mapH * 0.55} viewBox="0 0 200 360">
            {/* Body silhouette */}
            <Path d={BODY_PATH} fill={theme.bgElevated} stroke={theme.border} strokeWidth={1.5} />
            {/* Head */}
            <Ellipse cx={100} cy={38} rx={16} ry={19} fill={theme.bgElevated} stroke={theme.border} strokeWidth={1.5} />

            {/* Muscle zones */}
            {muscles.map(m => {
              const col = getMuscleColor(m.key);
              const isSelected = selectedMuscle === m.key;
              // Split ellipse left/right for biceps/triceps to look more realistic
              if (m.key === 'biceps' || m.key === 'triceps') {
                return (
                  <G key={m.key}>
                    <Ellipse cx={70} cy={m.cy} rx={12} ry={m.ry} fill={col} fillOpacity={0.8} stroke={isSelected ? '#fff' : col} strokeWidth={isSelected ? 2 : 0.5} />
                    <Ellipse cx={130} cy={m.cy} rx={12} ry={m.ry} fill={col} fillOpacity={0.8} stroke={isSelected ? '#fff' : col} strokeWidth={isSelected ? 2 : 0.5} />
                    {/* Tap targets */}
                    <Ellipse cx={70} cy={m.cy} rx={14} ry={m.ry + 4} fill="transparent" onPress={() => setSelectedMuscle(selectedMuscle === m.key ? null : m.key)} />
                    <Ellipse cx={130} cy={m.cy} rx={14} ry={m.ry + 4} fill="transparent" onPress={() => setSelectedMuscle(selectedMuscle === m.key ? null : m.key)} />
                    <SvgText x={100} y={m.cy + 1} textAnchor="middle" alignmentBaseline="middle" fontSize={8} fontWeight="700" fill={theme.mode === 'dark' ? '#fff' : '#222'} fillOpacity={0.9}>{m.label}</SvgText>
                  </G>
                );
              }
              if (m.key === 'quads' || m.key === 'hamstrings') {
                return (
                  <G key={m.key}>
                    <Ellipse cx={78} cy={m.cy} rx={18} ry={m.ry} fill={col} fillOpacity={0.8} stroke={isSelected ? '#fff' : col} strokeWidth={isSelected ? 2 : 0.5} />
                    <Ellipse cx={122} cy={m.cy} rx={18} ry={m.ry} fill={col} fillOpacity={0.8} stroke={isSelected ? '#fff' : col} strokeWidth={isSelected ? 2 : 0.5} />
                    <Ellipse cx={78} cy={m.cy} rx={20} ry={m.ry + 4} fill="transparent" onPress={() => setSelectedMuscle(selectedMuscle === m.key ? null : m.key)} />
                    <Ellipse cx={122} cy={m.cy} rx={20} ry={m.ry + 4} fill="transparent" onPress={() => setSelectedMuscle(selectedMuscle === m.key ? null : m.key)} />
                    <SvgText x={100} y={m.cy + 1} textAnchor="middle" alignmentBaseline="middle" fontSize={8} fontWeight="700" fill={theme.mode === 'dark' ? '#fff' : '#222'} fillOpacity={0.9}>{m.label}</SvgText>
                  </G>
                );
              }
              return (
                <G key={m.key}>
                  <Ellipse cx={m.cx} cy={m.cy} rx={m.rx} ry={m.ry} fill={col} fillOpacity={0.85} stroke={isSelected ? '#fff' : col} strokeWidth={isSelected ? 2 : 0.5} onPress={() => setSelectedMuscle(selectedMuscle === m.key ? null : m.key)} />
                  <SvgText x={m.cx} y={m.cy + 1} textAnchor="middle" alignmentBaseline="middle" fontSize={9} fontWeight="700" fill={theme.mode === 'dark' ? '#fff' : '#222'} fillOpacity={0.9}>{m.label}</SvgText>
                </G>
              );
            })}
          </Svg>

          {/* Legend */}
          <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { col: theme.primary, label: 'Con objetivo' },
              { col: theme.secondary, label: 'Trabajado esta semana' },
              { col: theme.mode === 'dark' ? '#3A3F52' : '#C8C4BC', label: 'Sin datos' },
            ].map(({ col, label }) => (
              <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: col }} />
                <Text style={{ color: theme.textMuted, fontSize: 10 }}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Selected muscle panel */}
        {selectedMuscle && muscleStats && (
          <View style={{ marginHorizontal: Spacing.md, marginTop: Spacing.md, backgroundColor: theme.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: theme.primary + '50', overflow: 'hidden' }}>
            <LinearGradient colors={[theme.primary + '33', 'transparent']} style={{ height: 3 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <View style={{ padding: Spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '900' }}>{MUSCLE_LABELS[selectedMuscle] || selectedMuscle}</Text>
                <TouchableOpacity onPress={() => setSelectedMuscle(null)}>
                  <Text style={{ color: theme.textMuted, fontSize: 20 }}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {[
                  { val: muscleStats.totalSessions.toString(), lbl: 'Sesiones totales', col: theme.primary },
                  { val: muscleStats.thisWeek.toString(), lbl: 'Esta semana', col: theme.secondary },
                  { val: muscleStats.bestWeight > 0 ? `${muscleStats.bestWeight}kg` : '—', lbl: 'Mejor peso', col: theme.warning },
                ].map(({ val, lbl, col }) => (
                  <View key={lbl} style={{ flex: 1, backgroundColor: theme.bgElevated, borderRadius: Radius.md, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
                    <Text style={{ color: col, fontSize: 18, fontWeight: '900' }}>{val}</Text>
                    <Text style={{ color: theme.textMuted, fontSize: 9, fontWeight: '700', textAlign: 'center', marginTop: 2 }}>{lbl.toUpperCase()}</Text>
                  </View>
                ))}
              </View>
              {muscleStats.bestExercise && (
                <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 12 }}>
                  💪 Mejor marca en: <Text style={{ fontWeight: '700', color: theme.textPrimary }}>{muscleStats.bestExercise}</Text>
                </Text>
              )}
              {selectedGoal ? (
                <View>
                  <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 }}>OBJETIVO ACTIVO</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                    <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: '600' }}>{selectedGoal.title}</Text>
                    <Text style={{ color: theme.textMuted, fontSize: 12 }}>{selectedGoal.currentValue}/{selectedGoal.targetValue}kg</Text>
                  </View>
                  <ProgressBar progress={Math.min(1, selectedGoal.currentValue / selectedGoal.targetValue)} color={theme.primary} height={8} gradient />
                </View>
              ) : (
                <Button title="+ Añadir objetivo para este músculo" onPress={() => openNew(selectedMuscle)} variant="ghost" size="sm" />
              )}
            </View>
          </View>
        )}

        {/* Goals list */}
        <View style={{ paddingHorizontal: Spacing.md, marginTop: Spacing.lg }}>
          <SectionHeader title="Mis Objetivos" action={{ label: '+ Nuevo', onPress: () => openNew() }} />
          {goals.length === 0
            ? <EmptyState icon="🎯" title="Sin objetivos" subtitle="Crea objetivos de fuerza por músculo y haz seguimiento aquí" action={{ label: '+ Crear objetivo', onPress: () => openNew() }} />
            : goals.map(g => {
              const pct = Math.min(1, g.currentValue / g.targetValue);
              const done = pct >= 1;
              return (
                <View key={g.id} style={{ backgroundColor: theme.bgCard, borderRadius: Radius.md, padding: Spacing.md, marginBottom: 10, borderWidth: 1, borderColor: done ? theme.success + '50' : theme.border }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: '700' }}>{g.title}</Text>
                      {g.muscleGroup && <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>{MUSCLE_LABELS[g.muscleGroup] || g.muscleGroup}</Text>}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      {done && <Badge label="✓ Logrado" color={theme.success} />}
                      <TouchableOpacity onPress={() => openEdit(g)}><Text style={{ fontSize: 18 }}>✏️</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => Alert.alert('Eliminar', '¿Eliminar este objetivo?', [
                        { text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: () => deleteGoal(g.id) },
                      ])}><Text style={{ fontSize: 18 }}>🗑️</Text></TouchableOpacity>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 5 }}>
                    <Text style={{ color: theme.textMuted, fontSize: 11 }}>Actual: <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>{g.currentValue}{g.unit}</Text></Text>
                    <Text style={{ color: theme.textMuted, fontSize: 11 }}>Meta: <Text style={{ color: theme.primary, fontWeight: '700' }}>{g.targetValue}{g.unit}</Text></Text>
                  </View>
                  <ProgressBar progress={pct} color={done ? theme.success : theme.primary} height={8} gradient />
                  <Text style={{ color: done ? theme.success : theme.textMuted, fontSize: 11, textAlign: 'right', marginTop: 5, fontWeight: done ? '700' : '400' }}>{Math.round(pct * 100)}%</Text>
                </View>
              );
            })
          }
        </View>
      </ScrollView>

      {/* Goal modal */}
      <Modal visible={showGoalModal} animationType="slide" transparent onRequestClose={() => setShowGoalModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
              <Text style={{ color: theme.textPrimary, fontSize: 20, fontWeight: '900' }}>{editing ? 'Editar objetivo' : 'Nuevo objetivo'}</Text>
              <TouchableOpacity onPress={() => setShowGoalModal(false)}><Text style={{ color: theme.textSecondary, fontSize: 26 }}>✕</Text></TouchableOpacity>
            </View>
            <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 5 }}>NOMBRE</Text>
            <TextInput style={{ backgroundColor: theme.bgElevated, borderWidth: 1, borderColor: theme.border, borderRadius: Radius.md, padding: 12, fontSize: 15, color: theme.textPrimary, marginBottom: 14 }}
              value={title} onChangeText={setTitle} placeholder="Ej: Press banca 100kg..." placeholderTextColor={theme.textMuted} />
            <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 5 }}>MÚSCULO</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {GOAL_MUSCLES.map(m => (
                <TouchableOpacity key={m} onPress={() => setMuscle(m)}
                  style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, marginRight: 6, backgroundColor: muscle === m ? theme.primary : theme.bgElevated, borderWidth: 1, borderColor: muscle === m ? theme.primary : theme.border }}>
                  <Text style={{ color: muscle === m ? '#fff' : theme.textSecondary, fontSize: 12, fontWeight: '600' }}>{MUSCLE_LABELS[m]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 5 }}>ACTUAL (kg)</Text>
                <TextInput style={{ backgroundColor: theme.bgElevated, borderWidth: 1, borderColor: theme.border, borderRadius: Radius.md, padding: 12, fontSize: 18, color: theme.textPrimary, fontWeight: '700', textAlign: 'center' }}
                  value={currentVal} onChangeText={setCurrentVal} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={theme.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 5 }}>META (kg)</Text>
                <TextInput style={{ backgroundColor: theme.bgElevated, borderWidth: 1, borderColor: theme.primary + '60', borderRadius: Radius.md, padding: 12, fontSize: 18, color: theme.textPrimary, fontWeight: '700', textAlign: 'center' }}
                  value={targetVal} onChangeText={setTargetVal} keyboardType="decimal-pad" placeholder="100" placeholderTextColor={theme.textMuted} />
              </View>
            </View>
            <Button title={editing ? '💾 Guardar' : '✅ Crear objetivo'} onPress={save} fullWidth size="lg" disabled={!title.trim() || !targetVal} />
          </View>
        </View>
      </Modal>
    </View>
  );
}
