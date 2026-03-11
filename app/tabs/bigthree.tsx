import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGymStore } from '../../src/store/gymStore';
import { Badge, SimpleBarChart, useTheme } from '../../src/components/ui';
import { Spacing, Radius, getShadow } from '../../src/constants/theme';
import { calculate1RM, formatDate } from '../../src/utils/calculations';

const BIG3 = [
  { key: 'bench_press', name: 'Press Banca',  emoji: '🏋️', color: '#FF5014', desc: 'Pecho, tríceps, hombros', thresholds: [60,80,100,120,140] },
  { key: 'squat',       name: 'Sentadilla',   emoji: '🦵', color: '#00D4FF', desc: 'Cuádriceps, glúteos, isquios', thresholds: [80,100,130,160,200] },
  { key: 'deadlift',    name: 'Peso Muerto',  emoji: '⛓️', color: '#FFB800', desc: 'Espalda, glúteos, isquios', thresholds: [100,130,160,200,250] },
];

const LEVEL_LABELS = ['Principiante','Novato','Intermedio','Avanzado','Élite'];
const LEVEL_COLORS = ['#888','#4CAF50','#2196F3','#9C27B0','#FF5014'];

function getLevel(weight: number, thresholds: number[]) {
  let lvl = 0;
  for (let i = 0; i < thresholds.length; i++) if (weight >= thresholds[i]) lvl = i + 1;
  return lvl;
}

export default function BigThreeScreen() {
  const theme = useTheme();
  const { prs, setManualPR, getExerciseHistory } = useGymStore();

  const [modalEx, setModalEx] = useState<typeof BIG3[0] | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('1');
  const [open, setOpen] = useState<string | null>(null);

  const total = BIG3.reduce((acc, e) => acc + (prs.find(p => p.exerciseId === e.key)?.estimated1RM || 0), 0);

  const savePR = () => {
    if (!modalEx || !weight || isNaN(Number(weight))) return;
    setManualPR(modalEx.key, Number(weight), Number(reps));
    setModalEx(null); setWeight(''); setReps('1');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.bg }} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={theme.mode === 'dark' ? ['#1A0D00','#181B20'] : ['#F5E8D8','#ECEAE5']}
        style={{ paddingTop: 56, paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl }}>
        <Text style={{ color: theme.textPrimary, fontSize: 28, fontWeight: '900', letterSpacing: -1 }}>Big 3</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 3 }}>Introduce tus mejores marcas</Text>

        {/* Total */}
        <View style={{ marginTop: Spacing.md, backgroundColor: theme.bgCard, borderRadius: Radius.lg,
          padding: Spacing.md, borderWidth: 1, borderColor: theme.borderAccent, ...getShadow(theme, 'glow') }}>
          <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 }}>TOTAL BIG 3 (1RM estimado)</Text>
          <Text style={{ color: theme.primary, fontSize: 52, fontWeight: '900', letterSpacing: -2, marginVertical: 4 }}>
            {total > 0 ? `${total}kg` : '—'}
          </Text>
          {total > 0 && <Badge label={total >= 500 ? 'ÉLITE' : total >= 380 ? 'AVANZADO' : total >= 270 ? 'INTERMEDIO' : 'NOVATO'}
            color={total >= 500 ? '#FF5014' : total >= 380 ? '#9C27B0' : total >= 270 ? '#2196F3' : '#4CAF50'} size="md" />}
        </View>
      </LinearGradient>

      <View style={{ paddingHorizontal: Spacing.md, paddingTop: Spacing.md }}>
        {BIG3.map(ex => {
          const pr = prs.find(p => p.exerciseId === ex.key);
          const lvl = pr ? getLevel(pr.estimated1RM, ex.thresholds) : 0;
          const isOpen = open === ex.key;
          const history = getExerciseHistory(ex.key);
          const nextT = ex.thresholds.find(t => t > (pr?.estimated1RM || 0)) || ex.thresholds[ex.thresholds.length - 1];
          const prevT = ex.thresholds.filter(t => t <= (pr?.estimated1RM || 0)).pop() || 0;
          const pct = prevT >= nextT ? 1 : ((pr?.estimated1RM || 0) - prevT) / (nextT - prevT);

          return (
            <View key={ex.key} style={{ marginBottom: Spacing.md, backgroundColor: theme.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: isOpen ? ex.color + '50' : theme.border, overflow: 'hidden', ...getShadow(theme) }}>
              <LinearGradient colors={[ex.color + 'DD', ex.color + '22']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 3 }} />
              <TouchableOpacity onPress={() => setOpen(isOpen ? null : ex.key)} activeOpacity={0.85} style={{ padding: Spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <Text style={{ fontSize: 36 }}>{ex.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '900' }}>{ex.name}</Text>
                    <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 1 }}>{ex.desc}</Text>
                  </View>
                  <Text style={{ color: theme.textMuted, fontSize: 16 }}>{isOpen ? '▲' : '▼'}</Text>
                </View>

                {pr ? (
                  <>
                    <View style={{ flexDirection: 'row', backgroundColor: theme.bgElevated, borderRadius: Radius.md, borderWidth: 1, borderColor: theme.border, overflow: 'hidden', marginBottom: 12 }}>
                      {[
                        { val: `${pr.weight}kg`, sub: `${pr.reps} rep${pr.reps > 1 ? 's' : ''}`, lbl: 'MARCA', col: ex.color },
                        { val: `${pr.estimated1RM}kg`, sub: 'fórmula Epley', lbl: '1RM EST.', col: theme.secondary },
                      ].map((s, i) => (
                        <View key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderRightWidth: i < 1 ? 1 : 0, borderRightColor: theme.border }}>
                          <Text style={{ color: s.col, fontSize: 24, fontWeight: '900' }}>{s.val}</Text>
                          <Text style={{ color: theme.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.8 }}>{s.lbl}</Text>
                          <Text style={{ color: theme.textMuted, fontSize: 9, marginTop: 2 }}>{s.sub}</Text>
                        </View>
                      ))}
                    </View>
                    {lvl > 0 && <Badge label={LEVEL_LABELS[lvl - 1]} color={LEVEL_COLORS[lvl - 1]} style={{ marginBottom: 10 }} />}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ color: theme.textMuted, fontSize: 10 }}>{prevT}kg</Text>
                      <Text style={{ color: theme.textMuted, fontSize: 10 }}>Meta: {nextT}kg</Text>
                    </View>
                    <View style={{ height: 8, backgroundColor: theme.bgSunken, borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: theme.border }}>
                      <LinearGradient colors={[ex.color, ex.color + 'AA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={{ width: `${Math.min(100, pct * 100)}%` as any, height: 8 }} />
                    </View>
                    <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 5, textAlign: 'right' }}>Registrado: {formatDate(pr.date)}</Text>
                  </>
                ) : (
                  <View style={{ backgroundColor: theme.bgElevated, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
                    <Text style={{ color: theme.textMuted, fontSize: 13, marginBottom: 8 }}>Sin marca todavía</Text>
                  </View>
                )}

                <TouchableOpacity onPress={() => { setModalEx(ex); setWeight(pr ? String(pr.weight) : ''); setReps(pr ? String(pr.reps) : '1'); }}
                  style={{ marginTop: 10, borderRadius: Radius.md, borderWidth: 1, borderColor: ex.color + '60', paddingVertical: 10, alignItems: 'center', backgroundColor: ex.color + '10' }}>
                  <Text style={{ color: ex.color, fontWeight: '700', fontSize: 13 }}>{pr ? '✏️ Actualizar marca' : '+ Introducir marca'}</Text>
                </TouchableOpacity>
              </TouchableOpacity>

              {/* Expanded history */}
              {isOpen && history.length > 0 && (
                <View style={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, borderTopWidth: 1, borderTopColor: theme.border }}>
                  <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '700', marginTop: Spacing.md, marginBottom: 8 }}>Historial 1RM</Text>
                  <View style={{ backgroundColor: theme.bgElevated, borderRadius: Radius.md, padding: 8, marginBottom: 10 }}>
                    <SimpleBarChart
                      data={history.slice(-8).map(h => ({
                        label: new Date(h.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
                        value: h.estimated1RM,
                      }))}
                      color={ex.color} height={130} suffix="kg" />
                  </View>
                  {history.slice().reverse().slice(0, 5).map((h, i) => (
                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                      <Text style={{ color: theme.textMuted, fontSize: 12 }}>{formatDate(h.date)}</Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{h.weight}kg × {h.reps}r</Text>
                      <Text style={{ color: ex.color, fontSize: 12, fontWeight: '700' }}>1RM: {h.estimated1RM}kg</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* ── Manual PR Modal ── */}
      <Modal visible={!!modalEx} animationType="slide" transparent onRequestClose={() => setModalEx(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
              <Text style={{ color: theme.textPrimary, fontSize: 20, fontWeight: '900' }}>
                {modalEx?.emoji} {modalEx?.name}
              </Text>
              <TouchableOpacity onPress={() => setModalEx(null)}>
                <Text style={{ color: theme.textSecondary, fontSize: 26 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 }}>PESO LEVANTADO (kg)</Text>
            <TextInput
              style={{ backgroundColor: theme.bgElevated, borderWidth: 1, borderColor: modalEx ? modalEx.color + '60' : theme.border, borderRadius: Radius.md, padding: 14, fontSize: 28, color: theme.textPrimary, marginBottom: Spacing.md, fontWeight: '900', textAlign: 'center' }}
              value={weight} onChangeText={setWeight} keyboardType="decimal-pad"
              placeholder="100" placeholderTextColor={theme.textMuted} autoFocus />

            <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 }}>REPETICIONES</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: Spacing.lg }}>
              {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                <TouchableOpacity key={n} onPress={() => setReps(String(n))}
                  style={{ flex: 1, paddingVertical: 10, borderRadius: Radius.sm, alignItems: 'center',
                    backgroundColor: reps === String(n) ? (modalEx?.color || theme.primary) : theme.bgElevated,
                    borderWidth: 1, borderColor: reps === String(n) ? (modalEx?.color || theme.primary) : theme.border }}>
                  <Text style={{ color: reps === String(n) ? '#fff' : theme.textSecondary, fontWeight: '700', fontSize: 14 }}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {weight ? (
              <View style={{ backgroundColor: theme.bgElevated, borderRadius: Radius.md, padding: 14, marginBottom: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
                <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 }}>1RM ESTIMADO (Epley)</Text>
                <Text style={{ color: modalEx?.color || theme.primary, fontSize: 36, fontWeight: '900', marginTop: 4 }}>
                  {calculate1RM(Number(weight), Number(reps))}kg
                </Text>
              </View>
            ) : null}

            <TouchableOpacity onPress={savePR}
              style={{ borderRadius: Radius.md, padding: 16, alignItems: 'center', backgroundColor: modalEx?.color || theme.primary }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>💾 Guardar marca</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
