import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGymStore } from '../../src/store/gymStore';
import { Card, SectionHeader, EmptyState, Button, Badge, ProgressBar, SimpleBarChart, useTheme } from '../../src/components/ui';
import { Spacing, Radius } from '../../src/constants/theme';
import { generateId } from '../../src/utils/calculations';
import { BodyWeightEntry, BodyWeightGoal } from '../../src/types';

// ── BMI helpers ──────────────────────────────────────────────────────────────
function calcBMI(w: number, hCm: number) { const h = hCm/100; return +(w/(h*h)).toFixed(1); }
function bmiInfo(bmi: number) {
  if (bmi < 18.5) return { label: 'Bajo peso', color: '#00D4FF', emoji: '📉' };
  if (bmi < 25)   return { label: 'Normal',    color: '#00E87A', emoji: '✅' };
  if (bmi < 30)   return { label: 'Sobrepeso', color: '#FFB800', emoji: '⚠️' };
  if (bmi < 35)   return { label: 'Obesidad I',color: '#FF5014', emoji: '🔴' };
  return               { label: 'Obesidad II', color: '#FF2D55', emoji: '🔴' };
}
function bmiScale(bmi: number) { return Math.min(1, Math.max(0, (bmi - 14) / 22)); }
function fmtD(iso: string) { const d = new Date(iso); return `${d.getDate()}/${d.getMonth()+1}`; }
function fmtFull(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
}

// ── Body composition entry (bascula inteligente) ─────────────────────────────
interface BodyComposition {
  id: string;
  date: string;
  fatPct?: number;       // % grasa
  muscleMass?: number;   // kg músculo
  boneMass?: number;     // kg hueso
  water?: number;        // % agua
  visceralFat?: number;  // índice grasa visceral
  metabolicAge?: number;
  bmr?: number;          // Basal Metabolic Rate kcal
  notes?: string;
}

// Extend store access inline for body composition (local state + AsyncStorage via gymStore)

export default function BodyScreen() {
  const theme = useTheme();
  const { bodyWeightEntries, bodyWeightGoal, addBodyWeightEntry, deleteBodyWeightEntry, setBodyWeightGoal } = useGymStore();

  const [tab, setTab] = useState<'weight' | 'health'>('weight');
  const [showLogModal, setShowLogModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showCompModal, setShowCompModal] = useState(false);
  const [editingComp, setEditingComp] = useState<BodyComposition | null>(null);
  const [compositions, setCompositions] = useState<BodyComposition[]>([]);

  // Weight log form
  const [logWeight, setLogWeight] = useState('');
  const [logNotes, setLogNotes] = useState('');

  // Goal form
  const [gTarget, setGTarget] = useState(bodyWeightGoal?.targetWeight ? String(bodyWeightGoal.targetWeight) : '');
  const [gHeight, setGHeight] = useState(bodyWeightGoal?.height ? String(bodyWeightGoal.height) : '');
  const [gDirection, setGDirection] = useState<'lose'|'gain'|'maintain'>(bodyWeightGoal?.direction || 'lose');
  const [heightInput, setHeightInput] = useState(bodyWeightGoal?.height ? String(bodyWeightGoal.height) : ''); // standalone height for BMI without goal

  // Composition form
  const [cFat, setCFat] = useState('');
  const [cMuscle, setCMuscle] = useState('');
  const [cBone, setCBone] = useState('');
  const [cWater, setCWater] = useState('');
  const [cVisceral, setCVisceral] = useState('');
  const [cMetAge, setCMetAge] = useState('');
  const [cBMR, setCBMR] = useState('');
  const [cNotes, setCNotes] = useState('');

  const sorted = [...bodyWeightEntries].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latest = sorted[0];
  const heightCm = bodyWeightGoal?.height || (parseFloat(heightInput) || 0);
  const bmi = latest && heightCm > 0 ? calcBMI(latest.weight, heightCm) : 0;
  const bmiData = bmi > 0 ? bmiInfo(bmi) : null;

  const chartData = [...bodyWeightEntries]
    .sort((a,b) => new Date(a.date).getTime()-new Date(b.date).getTime())
    .slice(-10)
    .map(e => ({ label: fmtD(e.date), value: e.weight }));

  const sortedComp = [...compositions].sort((a,b) => new Date(b.date).getTime()-new Date(a.date).getTime());
  const latestComp = sortedComp[0];

  const saveLog = () => {
    const w = parseFloat(logWeight);
    if (isNaN(w) || w < 20 || w > 500) { Alert.alert('Peso inválido'); return; }
    addBodyWeightEntry({ id: generateId(), weight: w, date: new Date().toISOString(), notes: logNotes.trim() || undefined });
    setLogWeight(''); setLogNotes(''); setShowLogModal(false);
  };

  const saveGoal = () => {
    const t = parseFloat(gTarget), h = parseFloat(gHeight);
    if (isNaN(t) || t < 20) { Alert.alert('Peso objetivo inválido'); return; }
    if (isNaN(h) || h < 100 || h > 250) { Alert.alert('Altura inválida', 'Introduce cm (ej: 175)'); return; }
    setBodyWeightGoal({ targetWeight: t, direction: gDirection, height: h });
    setHeightInput(String(h));
    setShowGoalModal(false);
  };

  const openComp = (c?: BodyComposition) => {
    setEditingComp(c || null);
    setCFat(c?.fatPct ? String(c.fatPct) : '');
    setCMuscle(c?.muscleMass ? String(c.muscleMass) : '');
    setCBone(c?.boneMass ? String(c.boneMass) : '');
    setCWater(c?.water ? String(c.water) : '');
    setCVisceral(c?.visceralFat ? String(c.visceralFat) : '');
    setCMetAge(c?.metabolicAge ? String(c.metabolicAge) : '');
    setCBMR(c?.bmr ? String(c.bmr) : '');
    setCNotes(c?.notes || '');
    setShowCompModal(true);
  };

  const saveComp = () => {
    const entry: BodyComposition = {
      id: editingComp?.id || generateId(),
      date: editingComp?.date || new Date().toISOString(),
      fatPct: parseFloat(cFat) || undefined,
      muscleMass: parseFloat(cMuscle) || undefined,
      boneMass: parseFloat(cBone) || undefined,
      water: parseFloat(cWater) || undefined,
      visceralFat: parseFloat(cVisceral) || undefined,
      metabolicAge: parseFloat(cMetAge) || undefined,
      bmr: parseFloat(cBMR) || undefined,
      notes: cNotes.trim() || undefined,
    };
    if (editingComp) setCompositions(p => p.map(c => c.id === editingComp.id ? entry : c));
    else setCompositions(p => [entry, ...p]);
    setShowCompModal(false);
  };

  const deleteComp = (id: string) => Alert.alert('Eliminar', '¿Eliminar este registro?', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: () => setCompositions(p => p.filter(c => c.id !== id)) },
  ]);

  const progressPct = () => {
    if (!bodyWeightGoal || !latest || sorted.length < 2) return 0;
    const first = sorted[sorted.length-1].weight;
    const total = Math.abs(first - bodyWeightGoal.targetWeight);
    if (total === 0) return 1;
    return Math.min(1, Math.max(0, 1 - Math.abs(latest.weight - bodyWeightGoal.targetWeight) / total));
  };

  const dirLabels = {
    lose: { icon: '📉', label: 'Perder peso' },
    gain: { icon: '📈', label: 'Ganar peso' },
    maintain: { icon: '⚖️', label: 'Mantener' },
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Header */}
      <LinearGradient colors={theme.mode === 'dark' ? ['#001433','#181B20'] : ['#E0E8F5','#ECEAE5']}
        style={{ paddingTop: 56, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={{ color: theme.textPrimary, fontSize: 28, fontWeight: '900', letterSpacing: -1 }}>⚖️ Cuerpo</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 3 }}>Peso · IMC · Composición</Text>
          </View>
          <TouchableOpacity onPress={() => { setGTarget(bodyWeightGoal?.targetWeight ? String(bodyWeightGoal.targetWeight) : ''); setGHeight(bodyWeightGoal?.height ? String(bodyWeightGoal.height) : gHeight); setShowGoalModal(true); }}
            style={{ backgroundColor: theme.bgCard, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: theme.border }}>
            <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '600' }}>🎯 Objetivo</Text>
          </TouchableOpacity>
        </View>

        {/* Quick stats bar */}
        {(latest || bmi > 0) && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            {latest && (
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: Radius.md, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9, fontWeight: '700' }}>ACTUAL</Text>
                <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>{latest.weight}<Text style={{ fontSize: 12 }}>kg</Text></Text>
              </View>
            )}
            {bmi > 0 && bmiData && (
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: Radius.md, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9, fontWeight: '700' }}>IMC</Text>
                <Text style={{ color: bmiData.color, fontSize: 22, fontWeight: '900' }}>{bmi}</Text>
                <Text style={{ color: bmiData.color, fontSize: 9, fontWeight: '700' }}>{bmiData.label.toUpperCase()}</Text>
              </View>
            )}
            {bodyWeightGoal && (
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: Radius.md, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9, fontWeight: '700' }}>META</Text>
                <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>{bodyWeightGoal.targetWeight}<Text style={{ fontSize: 12 }}>kg</Text></Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{dirLabels[bodyWeightGoal.direction].icon}</Text>
              </View>
            )}
          </View>
        )}

        {/* Sub-tabs */}
        <View style={{ flexDirection: 'row', backgroundColor: theme.bgElevated, borderRadius: Radius.md, padding: 3, gap: 3, marginTop: 12, borderWidth: 1, borderColor: theme.border }}>
          {([['weight','⚖️ Peso'],['health','🔬 Composición']] as const).map(([t, label]) => (
            <TouchableOpacity key={t} onPress={() => setTab(t)}
              style={{ flex: 1, paddingVertical: 8, borderRadius: Radius.sm-2, alignItems: 'center', backgroundColor: tab===t ? theme.bgCard : 'transparent', borderWidth: tab===t ? 1 : 0, borderColor: tab===t ? theme.primary+'40' : 'transparent' }}>
              <Text style={{ color: tab===t ? theme.primary : theme.textMuted, fontSize: 12, fontWeight: '700' }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>

        {/* ── WEIGHT TAB ── */}
        {tab === 'weight' && (
          <>
            <Button title="+ Registrar peso hoy" onPress={() => { setLogWeight(''); setLogNotes(''); setShowLogModal(true); }} fullWidth style={{ marginBottom: Spacing.md }} />

            {/* If no height yet, prompt for it */}
            {!bodyWeightGoal && !heightInput && (
              <View style={{ backgroundColor: theme.bgCard, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: theme.secondary + '40', marginBottom: Spacing.md }}>
                <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 8 }}>📏 Introduce tu altura para calcular el IMC</Text>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <TextInput style={{ flex: 1, backgroundColor: theme.bgElevated, borderWidth: 1, borderColor: theme.border, borderRadius: Radius.md, padding: 10, fontSize: 16, color: theme.textPrimary, fontWeight: '700', textAlign: 'center' }}
                    value={heightInput} onChangeText={setHeightInput} keyboardType="number-pad" placeholder="175" placeholderTextColor={theme.textMuted} />
                  <Text style={{ color: theme.textSecondary, fontSize: 14 }}>cm</Text>
                </View>
              </View>
            )}

            {/* BMI scale */}
            {bmi > 0 && bmiData && (
              <Card style={{ marginBottom: Spacing.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <SectionHeader title="Índice de Masa Corporal" subtitle={`Altura: ${heightCm}cm`} style={{ marginBottom: 0, flex: 1 }} />
                  <Text style={{ fontSize: 28 }}>{bmiData.emoji}</Text>
                </View>
                <View style={{ height: 22, borderRadius: 11, overflow: 'hidden', marginBottom: 6 }}>
                  <LinearGradient colors={['#00D4FF','#00E87A','#FFB800','#FF5014','#FF2D55']} start={{x:0,y:0}} end={{x:1,y:0}} style={{flex:1}} />
                </View>
                {/* Pointer */}
                <View style={{ position: 'relative', height: 16 }}>
                  <View style={{ position: 'absolute', left: `${bmiScale(bmi) * 88}%` as any, top: -28, alignItems: 'center' }}>
                    <Text style={{ color: bmiData.color, fontSize: 14 }}>▼</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                  {['Bajo','Normal','Sobre.','Obesidad'].map(l => (
                    <Text key={l} style={{ color: theme.textMuted, fontSize: 9 }}>{l}</Text>
                  ))}
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: bmiData.color, fontSize: 36, fontWeight: '900', letterSpacing: -1 }}>{bmi}</Text>
                  <Badge label={bmiData.label} color={bmiData.color} size="md" style={{ marginTop: 4 }} />
                  <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 8, textAlign: 'center' }}>
                    IMC normal: 18.5 – 24.9 · Tu valor: {bmi}
                  </Text>
                </View>
              </Card>
            )}

            {/* Goal progress */}
            {bodyWeightGoal && latest && sorted.length >= 2 && (
              <Card style={{ marginBottom: Spacing.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: '800' }}>
                    {dirLabels[bodyWeightGoal.direction].icon} {dirLabels[bodyWeightGoal.direction].label}
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: 12 }}>{Math.round(progressPct() * 100)}%</Text>
                </View>
                <ProgressBar progress={progressPct()} color={theme.primary} height={10} gradient />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                  <Text style={{ color: theme.textMuted, fontSize: 11 }}>Inicio: {sorted[sorted.length-1].weight}kg</Text>
                  <Text style={{ color: theme.primary, fontSize: 11, fontWeight: '700' }}>Meta: {bodyWeightGoal.targetWeight}kg</Text>
                </View>
                {latest.weight !== bodyWeightGoal.targetWeight && (
                  <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 6, textAlign: 'center' }}>
                    Te {bodyWeightGoal.direction==='lose'?'faltan':'quedan'}{' '}
                    <Text style={{ fontWeight: '800', color: theme.textPrimary }}>
                      {Math.abs(latest.weight - bodyWeightGoal.targetWeight).toFixed(1)}kg
                    </Text> para tu meta
                  </Text>
                )}
              </Card>
            )}

            {/* Chart */}
            {chartData.length >= 2 && (
              <Card style={{ marginBottom: Spacing.md }}>
                <SectionHeader title="Evolución (últimas 10)" />
                <SimpleBarChart data={chartData} color={theme.secondary} height={140} suffix="kg" />
              </Card>
            )}

            {/* History */}
            <SectionHeader title="Registros" action={{ label: '+ Añadir', onPress: () => { setLogWeight(''); setLogNotes(''); setShowLogModal(true); } }} />
            {sorted.length === 0
              ? <EmptyState icon="⚖️" title="Sin registros" subtitle="Añade tu primer peso para empezar" />
              : sorted.map(e => (
                <View key={e.id} style={{ backgroundColor: theme.bgCard, borderRadius: Radius.md, padding: Spacing.md, marginBottom: 8, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '900' }}>{e.weight}<Text style={{ fontSize: 12, color: theme.textMuted }}>kg</Text></Text>
                    <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>{fmtFull(e.date)}</Text>
                    {e.notes && <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 3 }}>{e.notes}</Text>}
                  </View>
                  {bodyWeightGoal && (
                    <Text style={{ color: e.weight > bodyWeightGoal.targetWeight && bodyWeightGoal.direction==='lose' ? theme.warning : theme.success, fontSize: 20, marginRight: 8 }}>
                      {Math.abs(e.weight - bodyWeightGoal.targetWeight) < 0.5 ? '✅' : bodyWeightGoal.direction==='lose' && e.weight > bodyWeightGoal.targetWeight ? '📉' : '📈'}
                    </Text>
                  )}
                  <TouchableOpacity onPress={() => Alert.alert('Eliminar', '¿Eliminar este registro?', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Eliminar', style: 'destructive', onPress: () => deleteBodyWeightEntry(e.id) },
                  ])} style={{ padding: 8 }}>
                    <Text style={{ fontSize: 18 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))
            }
          </>
        )}

        {/* ── HEALTH / COMPOSITION TAB ── */}
        {tab === 'health' && (
          <>
            <View style={{ backgroundColor: theme.bgCard, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: theme.secondary + '40', marginBottom: Spacing.md }}>
              <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 6 }}>🔬 ¿Para qué sirve esto?</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12, lineHeight: 18 }}>
                Registra los datos de tu báscula inteligente (Xiaomi, Garmin, WHOOP, etc.) — grasa corporal, masa muscular, agua, grasa visceral y más. Los campos son opcionales, rellena solo lo que tenga tu báscula.
              </Text>
            </View>

            <Button title="+ Añadir medición" onPress={() => openComp()} fullWidth style={{ marginBottom: Spacing.md }} />

            {/* Latest composition summary */}
            {latestComp && (
              <Card glow style={{ marginBottom: Spacing.md }}>
                <SectionHeader title="Última medición" subtitle={fmtFull(latestComp.date)} />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { val: latestComp.fatPct != null ? `${latestComp.fatPct}%` : null, lbl: '% Grasa', col: theme.warning, icon: '🟡' },
                    { val: latestComp.muscleMass != null ? `${latestComp.muscleMass}kg` : null, lbl: 'Músculo', col: theme.success, icon: '💪' },
                    { val: latestComp.water != null ? `${latestComp.water}%` : null, lbl: 'Agua', col: theme.secondary, icon: '💧' },
                    { val: latestComp.boneMass != null ? `${latestComp.boneMass}kg` : null, lbl: 'Hueso', col: theme.textSecondary, icon: '🦴' },
                    { val: latestComp.visceralFat != null ? String(latestComp.visceralFat) : null, lbl: 'Grasa visc.', col: theme.danger, icon: '🔴' },
                    { val: latestComp.bmr != null ? `${latestComp.bmr}kcal` : null, lbl: 'Metab. basal', col: theme.primary, icon: '⚡' },
                    { val: latestComp.metabolicAge != null ? String(latestComp.metabolicAge) : null, lbl: 'Edad metab.', col: theme.textSecondary, icon: '🧬' },
                  ].filter(x => x.val != null).map(({ val, lbl, col, icon }) => (
                    <View key={lbl} style={{ width: '30%', backgroundColor: theme.bgElevated, borderRadius: Radius.md, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
                      <Text style={{ fontSize: 18 }}>{icon}</Text>
                      <Text style={{ color: col, fontSize: 16, fontWeight: '900', marginTop: 3 }}>{val}</Text>
                      <Text style={{ color: theme.textMuted, fontSize: 9, fontWeight: '700', textAlign: 'center', marginTop: 2 }}>{lbl.toUpperCase()}</Text>
                    </View>
                  ))}
                </View>
                {latestComp.notes && (
                  <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 12 }}>{latestComp.notes}</Text>
                )}
              </Card>
            )}

            {/* Composition history */}
            <SectionHeader title="Historial de mediciones" />
            {sortedComp.length === 0
              ? <EmptyState icon="🔬" title="Sin mediciones" subtitle="Añade datos de tu báscula inteligente para hacer seguimiento de tu composición corporal" />
              : sortedComp.map(c => (
                <View key={c.id} style={{ backgroundColor: theme.bgCard, borderRadius: Radius.md, padding: Spacing.md, marginBottom: 10, borderWidth: 1, borderColor: theme.border }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: '700' }}>{fmtFull(c.date)}</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity onPress={() => openComp(c)}><Text style={{ fontSize: 18 }}>✏️</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteComp(c.id)}><Text style={{ fontSize: 18 }}>🗑️</Text></TouchableOpacity>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {c.fatPct != null && <Badge label={`Grasa ${c.fatPct}%`} color={theme.warning} />}
                    {c.muscleMass != null && <Badge label={`Músculo ${c.muscleMass}kg`} color={theme.success} />}
                    {c.water != null && <Badge label={`Agua ${c.water}%`} color={theme.secondary} />}
                    {c.visceralFat != null && <Badge label={`Visceral ${c.visceralFat}`} color={theme.danger} />}
                    {c.bmr != null && <Badge label={`${c.bmr}kcal BMR`} color={theme.primary} />}
                  </View>
                  {c.notes && <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 8 }}>{c.notes}</Text>}
                </View>
              ))
            }
          </>
        )}
      </ScrollView>

      {/* ── LOG MODAL ── */}
      <Modal visible={showLogModal} animationType="slide" transparent onRequestClose={() => setShowLogModal(false)}>
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'flex-end' }}>
          <View style={{ backgroundColor:theme.bgCard, borderTopLeftRadius:24, borderTopRightRadius:24, padding:Spacing.lg, paddingBottom:40 }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:Spacing.md }}>
              <Text style={{ color:theme.textPrimary, fontSize:20, fontWeight:'900' }}>⚖️ Registrar peso</Text>
              <TouchableOpacity onPress={() => setShowLogModal(false)}><Text style={{ color:theme.textSecondary, fontSize:26 }}>✕</Text></TouchableOpacity>
            </View>
            <Text style={{ color:theme.textMuted, fontSize:11, fontWeight:'700', letterSpacing:0.8, marginBottom:6 }}>PESO (kg) *</Text>
            <TextInput style={{ backgroundColor:theme.bgElevated, borderWidth:1, borderColor:theme.primary+'60', borderRadius:Radius.md, padding:14, fontSize:28, color:theme.textPrimary, fontWeight:'900', textAlign:'center', marginBottom:Spacing.md }}
              value={logWeight} onChangeText={setLogWeight} keyboardType="decimal-pad" placeholder="75.0" placeholderTextColor={theme.textMuted} autoFocus />
            <Text style={{ color:theme.textMuted, fontSize:11, fontWeight:'700', letterSpacing:0.8, marginBottom:6 }}>NOTAS (opcional)</Text>
            <TextInput style={{ backgroundColor:theme.bgElevated, borderWidth:1, borderColor:theme.border, borderRadius:Radius.md, padding:12, fontSize:14, color:theme.textPrimary, marginBottom:Spacing.lg }}
              value={logNotes} onChangeText={setLogNotes} placeholder="En ayunas, tras entreno..." placeholderTextColor={theme.textMuted} />
            <Button title="✅ Guardar" onPress={saveLog} fullWidth size="lg" disabled={!logWeight} />
          </View>
        </View>
      </Modal>

      {/* ── GOAL MODAL ── */}
      <Modal visible={showGoalModal} animationType="slide" transparent onRequestClose={() => setShowGoalModal(false)}>
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'flex-end' }}>
          <View style={{ backgroundColor:theme.bgCard, borderTopLeftRadius:24, borderTopRightRadius:24, padding:Spacing.lg, paddingBottom:40 }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:Spacing.md }}>
              <Text style={{ color:theme.textPrimary, fontSize:20, fontWeight:'900' }}>🎯 Objetivo de peso</Text>
              <TouchableOpacity onPress={() => setShowGoalModal(false)}><Text style={{ color:theme.textSecondary, fontSize:26 }}>✕</Text></TouchableOpacity>
            </View>
            <View style={{ flexDirection:'row', gap:8, marginBottom:Spacing.md }}>
              {(['lose','gain','maintain'] as const).map(d => (
                <TouchableOpacity key={d} onPress={() => setGDirection(d)}
                  style={{ flex:1, paddingVertical:10, borderRadius:Radius.md, alignItems:'center', backgroundColor:gDirection===d?theme.primary:theme.bgElevated, borderWidth:1, borderColor:gDirection===d?theme.primary:theme.border }}>
                  <Text style={{ fontSize:18 }}>{dirLabels[d].icon}</Text>
                  <Text style={{ color:gDirection===d?'#fff':theme.textSecondary, fontSize:11, fontWeight:'700', marginTop:3 }}>{dirLabels[d].label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection:'row', gap:10, marginBottom:Spacing.lg }}>
              <View style={{ flex:1 }}>
                <Text style={{ color:theme.textMuted, fontSize:11, fontWeight:'700', letterSpacing:0.8, marginBottom:6 }}>PESO META (kg) *</Text>
                <TextInput style={{ backgroundColor:theme.bgElevated, borderWidth:1, borderColor:theme.primary+'60', borderRadius:Radius.md, padding:12, fontSize:20, color:theme.textPrimary, fontWeight:'800', textAlign:'center' }}
                  value={gTarget} onChangeText={setGTarget} keyboardType="decimal-pad" placeholder="70" placeholderTextColor={theme.textMuted} />
              </View>
              <View style={{ flex:1 }}>
                <Text style={{ color:theme.textMuted, fontSize:11, fontWeight:'700', letterSpacing:0.8, marginBottom:6 }}>ALTURA (cm) *</Text>
                <TextInput style={{ backgroundColor:theme.bgElevated, borderWidth:1, borderColor:theme.border, borderRadius:Radius.md, padding:12, fontSize:20, color:theme.textPrimary, fontWeight:'800', textAlign:'center' }}
                  value={gHeight} onChangeText={setGHeight} keyboardType="number-pad" placeholder="175" placeholderTextColor={theme.textMuted} />
              </View>
            </View>
            <Button title="💾 Guardar objetivo" onPress={saveGoal} fullWidth size="lg" disabled={!gTarget || !gHeight} />
          </View>
        </View>
      </Modal>

      {/* ── COMPOSITION MODAL ── */}
      <Modal visible={showCompModal} animationType="slide" onRequestClose={() => setShowCompModal(false)}>
        <View style={{ flex:1, backgroundColor:theme.bg }}>
          <View style={{ paddingTop:56, paddingHorizontal:Spacing.md, paddingBottom:Spacing.md, borderBottomWidth:1, borderBottomColor:theme.border }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
              <Text style={{ color:theme.textPrimary, fontSize:20, fontWeight:'900' }}>🔬 {editingComp ? 'Editar' : 'Nueva'} medición</Text>
              <TouchableOpacity onPress={() => setShowCompModal(false)}><Text style={{ color:theme.textSecondary, fontSize:26 }}>✕</Text></TouchableOpacity>
            </View>
            <Text style={{ color:theme.textMuted, fontSize:12, marginTop:4 }}>Todos los campos son opcionales — rellena solo lo que tenga tu báscula</Text>
          </View>
          <ScrollView contentContainerStyle={{ padding:Spacing.md, paddingBottom:120 }} showsVerticalScrollIndicator={false}>
            {[
              { val: cFat, set: setCFat, label: '% Grasa corporal', placeholder: '20.5', icon: '🟡', hint: 'Normal hombre: 10-20% · Mujer: 20-30%' },
              { val: cMuscle, set: setCMuscle, label: 'Masa muscular (kg)', placeholder: '35.0', icon: '💪', hint: null },
              { val: cWater, set: setCWater, label: '% Agua corporal', placeholder: '55.0', icon: '💧', hint: 'Normal: 50-65%' },
              { val: cBone, set: setCBone, label: 'Masa ósea (kg)', placeholder: '3.0', icon: '🦴', hint: null },
              { val: cVisceral, set: setCVisceral, label: 'Índice grasa visceral', placeholder: '8', icon: '🔴', hint: 'Normal: < 12' },
              { val: cBMR, set: setCBMR, label: 'Metabolismo basal (kcal)', placeholder: '1800', icon: '⚡', hint: 'Calorías que quemas en reposo' },
              { val: cMetAge, set: setCMetAge, label: 'Edad metabólica', placeholder: '28', icon: '🧬', hint: null },
            ].map(({ val, set, label, placeholder, icon, hint }) => (
              <View key={label} style={{ marginBottom: Spacing.md }}>
                <Text style={{ color:theme.textMuted, fontSize:11, fontWeight:'700', letterSpacing:0.8, marginBottom:5 }}>{icon} {label.toUpperCase()}</Text>
                <TextInput style={{ backgroundColor:theme.bgElevated, borderWidth:1, borderColor:theme.border, borderRadius:Radius.md, padding:12, fontSize:16, color:theme.textPrimary, fontWeight:'700' }}
                  value={val} onChangeText={set} keyboardType="decimal-pad" placeholder={placeholder} placeholderTextColor={theme.textMuted} />
                {hint && <Text style={{ color:theme.textMuted, fontSize:10, marginTop:4 }}>{hint}</Text>}
              </View>
            ))}
            <View style={{ marginBottom: Spacing.md }}>
              <Text style={{ color:theme.textMuted, fontSize:11, fontWeight:'700', letterSpacing:0.8, marginBottom:5 }}>📝 NOTAS</Text>
              <TextInput style={{ backgroundColor:theme.bgElevated, borderWidth:1, borderColor:theme.border, borderRadius:Radius.md, padding:12, fontSize:14, color:theme.textPrimary, minHeight:60, textAlignVertical:'top' }}
                value={cNotes} onChangeText={setCNotes} placeholder="Observaciones, contexto..." placeholderTextColor={theme.textMuted} multiline />
            </View>
          </ScrollView>
          <View style={{ padding:Spacing.md, borderTopWidth:1, borderTopColor:theme.border, backgroundColor:theme.bg }}>
            <Button title={editingComp ? '💾 Guardar cambios' : '✅ Guardar medición'} onPress={saveComp} fullWidth size="lg"
              disabled={!cFat && !cMuscle && !cWater && !cBone && !cVisceral && !cBMR && !cMetAge} />
          </View>
        </View>
      </Modal>
    </View>
  );
}
