import React, { useState, useMemo } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useGymStore } from '../../src/store/gymStore';
import { Card, SectionHeader, EmptyState, SimpleBarChart, useTheme } from '../../src/components/ui';
import { Spacing, Radius } from '../../src/constants/theme';
import { formatDate, formatDuration } from '../../src/utils/calculations';

const { width: SW } = Dimensions.get('window');
const MUSCLE_ES: Record<string, string> = {
  chest:'Pecho', back:'Espalda', shoulders:'Hombros', biceps:'Bíceps',
  triceps:'Tríceps', quads:'Cuádriceps', hamstrings:'Femoral',
  glutes:'Glúteos', abs:'Abdomen', calves:'Gemelos',
  forearms:'Antebrazos', traps:'Trapecios', lats:'Dorsales',
};
const MUSCLE_COLOR: Record<string,string> = {
  chest:'#FF5014', back:'#00D4FF', shoulders:'#FFB800', biceps:'#00E87A',
  triceps:'#AA44FF', quads:'#FF4488', hamstrings:'#44AAFF', glutes:'#FF8800',
  abs:'#00FFAA', calves:'#FF4444', forearms:'#AAAAFF', traps:'#FFAA44', lats:'#44FFFF',
};

// ── Tiny sparkline bar chart (inline) ───────────────────────────────────────
const MiniChart: React.FC<{ data: number[]; color: string; h?: number }> = ({ data, color, h = 36 }) => {
  const theme = useTheme();
  if (data.length < 2) return null;
  const max = Math.max(...data, 0.001);
  const barW = Math.floor((SW - 80) / data.length) - 2;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: h, gap: 2 }}>
      {data.map((v, i) => (
        <View key={i} style={{
          width: Math.max(barW, 4),
          height: Math.max(2, (v / max) * h),
          backgroundColor: i === data.length - 1 ? color : color + '66',
          borderRadius: 2,
        }} />
      ))}
    </View>
  );
};

// ── Progress line chart (exercise evolution) ────────────────────────────────
const LineChart: React.FC<{ data: { label: string; value: number }[]; color: string }> = ({ data, color }) => {
  const theme = useTheme();
  if (data.length < 2) return (
    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
      <Text style={{ color: theme.textMuted, fontSize: 12 }}>Necesitas al menos 2 registros para ver la gráfica</Text>
    </View>
  );
  const W = SW - 80, H = 100;
  const vals = data.map(d => d.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * (W - 20) + 10,
    y: H - 8 - ((d.value - min) / range) * (H - 20),
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L${pts[pts.length-1].x},${H} L${pts[0].x},${H} Z`;

  return (
    <View>
      <View style={{ height: H, position: 'relative' }}>
        {/* SVG-like using absolute Views */}
        {/* Area fill using a solid background with opacity trick via gradient */}
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(f => (
            <View key={f} style={{ position: 'absolute', left: 0, right: 0, top: f * (H - 8), height: 1, backgroundColor: theme.border }} />
          ))}
          {/* Bars as substitute for line (works without SVG math) */}
          <View style={{ position: 'absolute', bottom: 8, left: 10, right: 10, flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
            {data.map((d, i) => {
              const barH = Math.max(4, ((d.value - min) / range) * (H - 20));
              const isLast = i === data.length - 1;
              const isPR = d.value === max;
              return (
                <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                  {isPR && <Text style={{ fontSize: 8, color: color, marginBottom: 1 }}>★</Text>}
                  <View style={{
                    width: '100%', height: barH,
                    backgroundColor: isLast ? color : (isPR ? color : color + '55'),
                    borderRadius: 3,
                    borderWidth: isPR ? 1 : 0,
                    borderColor: color,
                  }} />
                </View>
              );
            })}
          </View>
        </View>
        {/* Min/Max labels */}
        <Text style={{ position: 'absolute', right: 0, top: 0, color: theme.textMuted, fontSize: 9 }}>{max}kg</Text>
        <Text style={{ position: 'absolute', right: 0, bottom: 8, color: theme.textMuted, fontSize: 9 }}>{min}kg</Text>
      </View>
      {/* X labels (show first, middle, last) */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <Text style={{ color: theme.textMuted, fontSize: 9 }}>{data[0]?.label}</Text>
        <Text style={{ color: theme.textMuted, fontSize: 9 }}>{data[Math.floor(data.length / 2)]?.label}</Text>
        <Text style={{ color: theme.textMuted, fontSize: 9 }}>{data[data.length - 1]?.label}</Text>
      </View>
    </View>
  );
};

// ── Donut-style pie chart using View segments ───────────────────────────────
const MuscleDistribution: React.FC<{ data: {key:string;pct:number;sessions:number}[] }> = ({ data }) => {
  const theme = useTheme();
  const top = data.slice(0, 6);
  const maxSessions = Math.max(...top.map(d => d.sessions), 1);
  return (
    <View>
      {top.map(({ key, pct, sessions }) => {
        const col = MUSCLE_COLOR[key] || theme.primary;
        return (
          <View key={key} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: '700' }}>{MUSCLE_ES[key] || key}</Text>
              <Text style={{ color: col, fontSize: 12, fontWeight: '700' }}>{sessions} sesiones · {pct}%</Text>
            </View>
            <View style={{ height: 8, backgroundColor: theme.bgSunken, borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: theme.border }}>
              <LinearGradient colors={[col + 'AA', col]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ width: `${pct}%` as any, height: 8, borderRadius: 4 }} />
            </View>
          </View>
        );
      })}
    </View>
  );
};

// ── Day of week performance ──────────────────────────────────────────────────
const DayChart: React.FC<{ counts: number[] }> = ({ counts }) => {
  const theme = useTheme();
  const days = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
  const max = Math.max(...counts, 1);
  const bestDay = counts.indexOf(Math.max(...counts));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingTop: 8 }}>
      {counts.map((c, i) => (
        <View key={i} style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ color: i === bestDay ? theme.primary : theme.textMuted, fontSize: 10, fontWeight: i === bestDay ? '900' : '400', marginBottom: 4 }}>
            {c > 0 ? c : ''}
          </Text>
          <View style={{ width: '100%', height: Math.max(4, (c / max) * 70), backgroundColor: i === bestDay ? theme.primary : (c > 0 ? theme.primary + '55' : theme.border), borderRadius: 4 }} />
          <Text style={{ color: i === bestDay ? theme.primary : theme.textMuted, fontSize: 10, fontWeight: i === bestDay ? '900' : '400', marginTop: 4 }}>
            {days[i]}
          </Text>
        </View>
      ))}
    </View>
  );
};

export default function HistoryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { workouts, deleteWorkout, stats, prs, exercises, getExerciseHistory } = useGymStore();
  const [tab, setTab] = useState<'workouts' | 'stats'>('workouts');
  const [statsTab, setStatsTab] = useState<'overview' | 'muscles' | 'exercises' | 'time'>('overview');
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [showAllExercises, setShowAllExercises] = useState(false);

  const sorted = [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // ── Computed stats ────────────────────────────────────────────────────────
  const computed = useMemo(() => {
    if (!workouts.length) return null;

    // Avg session duration
    const avgDuration = Math.round(workouts.reduce((s, w) => s + w.duration, 0) / workouts.length);

    // Avg exercises per session
    const avgExercises = (workouts.reduce((s, w) => s + w.exercises.length, 0) / workouts.length).toFixed(1);

    // Avg sets per session
    const avgSets = (workouts.reduce((s, w) => s + w.exercises.reduce((a, e) => a + e.sets.length, 0), 0) / workouts.length).toFixed(1);

    // Day of week distribution (0=Mon..6=Sun)
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    workouts.forEach(w => {
      const d = new Date(w.date).getDay();
      const idx = d === 0 ? 6 : d - 1;
      dayCounts[idx]++;
    });

    // Muscle distribution
    const muscleSessions: Record<string, number> = {};
    workouts.forEach(w => {
      const muscles = new Set<string>();
      w.exercises.forEach(we => {
        const ex = exercises.find(e => e.id === we.exerciseId);
        if (ex) { muscles.add(ex.primaryMuscle); ex.secondaryMuscles.forEach(m => muscles.add(m)); }
      });
      muscles.forEach(m => { muscleSessions[m] = (muscleSessions[m] || 0) + 1; });
    });
    const totalMuscleSessions = Object.values(muscleSessions).reduce((a, b) => a + b, 0);
    const muscleData = Object.entries(muscleSessions)
      .sort((a, b) => b[1] - a[1])
      .map(([key, sessions]) => ({ key, sessions, pct: Math.round((sessions / totalMuscleSessions) * 100) }));

    // Weekly frequency (last 12 weeks)
    const weeklyData: { label: string; value: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const from = new Date(); from.setDate(from.getDate() - i * 7 - 7);
      const to = new Date(); to.setDate(to.getDate() - i * 7);
      const count = workouts.filter(w => { const d = new Date(w.date); return d >= from && d < to; }).length;
      weeklyData.push({ label: `S-${i}`, value: count });
    }

    // Best weeks
    const maxWeek = Math.max(...weeklyData.map(d => d.value));
    const bestStreak = stats.longestStreak;

    // Exercise stats: avg load, sessions count
    const exStats: Record<string, { sessions: number; maxWeight: number; avgLoad: number; history: { label: string; value: number }[] }> = {};
    exercises.forEach(ex => {
      const history = getExerciseHistory(ex.id);
      if (!history.length) return;
      const sessions = history.length;
      const maxWeight = Math.max(...history.map(h => h.weight));
      const avgLoad = Math.round(history.reduce((s, h) => s + h.weight, 0) / sessions);
      const chartHistory = history.slice(-10).map(h => ({
        label: new Date(h.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
        value: h.weight,
      }));
      exStats[ex.id] = { sessions, maxWeight, avgLoad, history: chartHistory };
    });

    // Sort exercises by session count
    const topExercises = Object.entries(exStats)
      .sort((a, b) => b[1].sessions - a[1].sessions)
      .slice(0, 20);

    return { avgDuration, avgExercises, avgSets, dayCounts, muscleData, weeklyData, maxWeek, topExercises, exStats };
  }, [workouts, exercises]);

  const visibleExercises = computed
    ? (showAllExercises ? computed.topExercises : computed.topExercises.slice(0, 5))
    : [];

  const selEx = selectedExercise
    ? exercises.find(e => e.id === selectedExercise)
    : null;
  const selHistory = selectedExercise && computed?.exStats[selectedExercise]?.history || [];

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <LinearGradient colors={theme.mode === 'dark' ? ['#0D1A0D', '#181B20'] : ['#E0F0E0', '#ECEAE5']}
        style={{ paddingTop: 56, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md }}>
        <Text style={{ color: theme.textPrimary, fontSize: 28, fontWeight: '900', letterSpacing: -1 }}>📊 Historial</Text>
        <View style={{ flexDirection: 'row', backgroundColor: theme.bgElevated, borderRadius: Radius.md, padding: 3, gap: 3, marginTop: 14, borderWidth: 1, borderColor: theme.border }}>
          {([['workouts', '🗒️ Entrenos'], ['stats', '📈 Stats']] as const).map(([t, label]) => (
            <TouchableOpacity key={t} onPress={() => setTab(t)}
              style={{ flex: 1, paddingVertical: 9, borderRadius: Radius.sm - 2, alignItems: 'center', backgroundColor: tab === t ? theme.bgCard : 'transparent', borderWidth: tab === t ? 1 : 0, borderColor: tab === t ? theme.primary + '40' : 'transparent' }}>
              <Text style={{ color: tab === t ? theme.primary : theme.textMuted, fontSize: 13, fontWeight: '700' }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>

        {/* ── WORKOUTS ── */}
        {tab === 'workouts' && (
          <>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: Spacing.md }}>
              <TouchableOpacity onPress={() => router.push('/workout/start')}
                style={{ flex: 2, backgroundColor: theme.primary, borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>▶ Nuevo entreno</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/workout/manual')}
                style={{ flex: 1, backgroundColor: theme.bgCard, borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
                <Text style={{ color: theme.textSecondary, fontWeight: '700', fontSize: 13 }}>+ Manual</Text>
              </TouchableOpacity>
            </View>
            {sorted.length === 0
              ? <EmptyState icon="📋" title="Sin entrenos" subtitle="Completa tu primer entreno para verlo aquí" />
              : sorted.map(w => (
                <TouchableOpacity key={w.id} onPress={() => router.push(`/workout/${w.id}`)}>
                  <View style={{ backgroundColor: theme.bgCard, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: 10, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 4, alignSelf: 'stretch', backgroundColor: theme.primary, borderRadius: 2, marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: '800', flex: 1 }}>{w.name}</Text>
                        {w.isManual && <View style={{ backgroundColor: theme.textMuted + '30', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}><Text style={{ color: theme.textMuted, fontSize: 9, fontWeight: '700' }}>MANUAL</Text></View>}
                      </View>
                      <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>{formatDate(w.date)}</Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
                        {w.exercises.length} ejercicios · {w.exercises.reduce((a, e) => a + e.sets.length, 0)} series · {formatDuration(w.duration)}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => Alert.alert('Eliminar', `¿Eliminar "${w.name}"?`, [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Eliminar', style: 'destructive', onPress: () => deleteWorkout(w.id) },
                    ])} style={{ padding: 8 }}>
                      <Text style={{ fontSize: 18 }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            }
          </>
        )}

        {/* ── STATS ── */}
        {tab === 'stats' && (
          <>
            {!computed || workouts.length === 0
              ? <EmptyState icon="📈" title="Sin datos" subtitle="Completa al menos un entreno para ver estadísticas" />
              : (
                <>
                  {/* Stats sub-tabs */}
                  <View style={{ flexDirection: 'row', backgroundColor: theme.bgElevated, borderRadius: Radius.md, padding: 3, gap: 2, marginBottom: Spacing.md, borderWidth: 1, borderColor: theme.border }}>
                    {([['overview', '📊 General'], ['muscles', '💪 Músculos'], ['exercises', '🏋️ Ejercicios'], ['time', '🕐 Tiempo']] as const).map(([t, label]) => (
                      <TouchableOpacity key={t} onPress={() => setStatsTab(t)}
                        style={{ flex: 1, paddingVertical: 7, borderRadius: Radius.sm - 2, alignItems: 'center', backgroundColor: statsTab === t ? theme.bgCard : 'transparent', borderWidth: statsTab === t ? 1 : 0, borderColor: statsTab === t ? theme.primary + '40' : 'transparent' }}>
                        <Text style={{ color: statsTab === t ? theme.primary : theme.textMuted, fontSize: 9, fontWeight: '700' }} numberOfLines={1}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* ── OVERVIEW ── */}
                  {statsTab === 'overview' && (
                    <>
                      {/* Quick KPIs */}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md }}>
                        {[
                          { val: workouts.length.toString(), lbl: 'Entrenos totales', icon: '🏋️', col: theme.primary },
                          { val: formatDuration(computed.avgDuration), lbl: 'Duración media', icon: '⏱️', col: theme.secondary },
                          { val: computed.avgExercises, lbl: 'Ejercicios/sesión', icon: '📋', col: theme.success },
                          { val: computed.avgSets, lbl: 'Series/sesión', icon: '🔁', col: theme.warning },
                          { val: stats.currentStreak.toString(), lbl: 'Racha actual (días)', icon: '🔥', col: '#FF6B35' },
                          { val: stats.longestStreak.toString(), lbl: 'Mejor racha', icon: '⚡', col: '#FFD700' },
                        ].map(({ val, lbl, icon, col }) => (
                          <View key={lbl} style={{ width: (SW - 48) / 2 - 4, backgroundColor: theme.bgCard, borderRadius: Radius.md, padding: 12, borderWidth: 1, borderColor: theme.border }}>
                            <Text style={{ fontSize: 22 }}>{icon}</Text>
                            <Text style={{ color: col, fontSize: 22, fontWeight: '900', marginTop: 4 }}>{val}</Text>
                            <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '600', marginTop: 2 }}>{lbl}</Text>
                          </View>
                        ))}
                      </View>

                      {/* Weekly frequency chart */}
                      <Card style={{ marginBottom: Spacing.md }}>
                        <SectionHeader title="Frecuencia semanal (12 semanas)" />
                        <SimpleBarChart data={computed.weeklyData} color={theme.primary} height={100} />
                        <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 8, textAlign: 'center' }}>
                          Mejor semana: <Text style={{ color: theme.primary, fontWeight: '700' }}>{computed.maxWeek} entrenos</Text>
                        </Text>
                      </Card>

                      {/* Day of week heatmap */}
                      <Card style={{ marginBottom: Spacing.md }}>
                        <SectionHeader title="Días con más entrenos" subtitle="Tu día favorito ⬇️" />
                        <DayChart counts={computed.dayCounts} />
                      </Card>
                    </>
                  )}

                  {/* ── MUSCLES ── */}
                  {statsTab === 'muscles' && (
                    <>
                      <Card style={{ marginBottom: Spacing.md }}>
                        <SectionHeader title="Distribución por músculo" subtitle="% de sesiones en que aparece" />
                        <MuscleDistribution data={computed.muscleData} />
                      </Card>

                      {/* Muscle detail cards */}
                      {computed.muscleData.slice(0, 8).map(({ key, sessions, pct }) => {
                        const col = MUSCLE_COLOR[key] || theme.primary;
                        // Weekly trend for this muscle
                        const weeks = Array.from({ length: 8 }, (_, i) => {
                          const from = new Date(); from.setDate(from.getDate() - (7 - i) * 7 - 7);
                          const to = new Date(); to.setDate(to.getDate() - (7 - i) * 7);
                          return workouts.filter(w => {
                            if (new Date(w.date) < from || new Date(w.date) >= to) return false;
                            return w.exercises.some(we => {
                              const ex = exercises.find(e => e.id === we.exerciseId);
                              return ex && (ex.primaryMuscle === key || ex.secondaryMuscles.includes(key as any));
                            });
                          }).length;
                        });
                        return (
                          <View key={key} style={{ backgroundColor: theme.bgCard, borderRadius: Radius.md, padding: Spacing.md, marginBottom: 10, borderWidth: 1, borderColor: col + '40' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                              <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: '800' }}>{MUSCLE_ES[key] || key}</Text>
                              <View style={{ flexDirection: 'row', gap: 8 }}>
                                <View style={{ backgroundColor: col + '22', borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3 }}>
                                  <Text style={{ color: col, fontSize: 12, fontWeight: '700' }}>{sessions} sesiones</Text>
                                </View>
                                <View style={{ backgroundColor: theme.bgElevated, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3 }}>
                                  <Text style={{ color: theme.textMuted, fontSize: 12 }}>{pct}%</Text>
                                </View>
                              </View>
                            </View>
                            <Text style={{ color: theme.textMuted, fontSize: 10, marginBottom: 6 }}>Tendencia 8 semanas →</Text>
                            <MiniChart data={weeks} color={col} h={32} />
                          </View>
                        );
                      })}
                    </>
                  )}

                  {/* ── EXERCISES ── */}
                  {statsTab === 'exercises' && (
                    <>
                      {/* Exercise detail if selected */}
                      {selectedExercise && selEx && (
                        <Card glow style={{ marginBottom: Spacing.md, borderColor: theme.primary + '40' }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: theme.textPrimary, fontSize: 17, fontWeight: '900' }}>{selEx.name}</Text>
                              <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>
                                {MUSCLE_ES[selEx.primaryMuscle] || selEx.primaryMuscle} · {selEx.equipment}
                              </Text>
                            </View>
                            <TouchableOpacity onPress={() => setSelectedExercise(null)}
                              style={{ padding: 6 }}>
                              <Text style={{ color: theme.textMuted, fontSize: 20 }}>✕</Text>
                            </TouchableOpacity>
                          </View>
                          {/* Stats row */}
                          {computed.exStats[selectedExercise] && (() => {
                            const es = computed.exStats[selectedExercise];
                            const pr = prs.find(p => p.exerciseId === selectedExercise);
                            return (
                              <>
                                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                                  {[
                                    { val: `${es.sessions}x`, lbl: 'Sesiones', col: theme.primary },
                                    { val: `${es.maxWeight}kg`, lbl: 'Máx. cargado', col: theme.success },
                                    { val: `${es.avgLoad}kg`, lbl: 'Carga media', col: theme.secondary },
                                    { val: pr ? `${pr.estimated1RM}kg` : '—', lbl: '1RM est.', col: theme.warning },
                                  ].map(({ val, lbl, col }) => (
                                    <View key={lbl} style={{ flex: 1, backgroundColor: theme.bgElevated, borderRadius: Radius.sm, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
                                      <Text style={{ color: col, fontSize: 14, fontWeight: '900' }}>{val}</Text>
                                      <Text style={{ color: theme.textMuted, fontSize: 8, fontWeight: '700', textAlign: 'center', marginTop: 2 }}>{lbl.toUpperCase()}</Text>
                                    </View>
                                  ))}
                                </View>
                                <Text style={{ color: theme.textMuted, fontSize: 10, marginBottom: 8, fontWeight: '700' }}>PROGRESIÓN DE PESO →</Text>
                                <LineChart data={es.history} color={theme.primary} />
                                {es.history.length >= 2 && (
                                  <View style={{ marginTop: 10, padding: 10, backgroundColor: theme.bgElevated, borderRadius: Radius.sm, flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                                      Inicio: <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>{es.history[0].value}kg</Text>
                                    </Text>
                                    <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                                      Ahora: <Text style={{ color: theme.primary, fontWeight: '700' }}>{es.history[es.history.length - 1].value}kg</Text>
                                    </Text>
                                    <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                                      {(() => {
                                        const diff = es.history[es.history.length-1].value - es.history[0].value;
                                        const pct = es.history[0].value > 0 ? ((diff/es.history[0].value)*100).toFixed(0) : 0;
                                        return diff >= 0
                                          ? <Text style={{ color: theme.success, fontWeight: '700' }}>+{diff}kg (+{pct}%)</Text>
                                          : <Text style={{ color: theme.danger, fontWeight: '700' }}>{diff}kg</Text>;
                                      })()}
                                    </Text>
                                  </View>
                                )}
                              </>
                            );
                          })()}
                        </Card>
                      )}

                      {/* Exercise list */}
                      <SectionHeader title="Ejercicios más trabajados" subtitle="Toca para ver la progresión" />
                      {visibleExercises.length === 0
                        ? <EmptyState icon="🏋️" title="Sin datos" subtitle="Completa entrenos para ver estadísticas por ejercicio" />
                        : visibleExercises.map(([exId, data]) => {
                          const ex = exercises.find(e => e.id === exId);
                          if (!ex) return null;
                          const pr = prs.find(p => p.exerciseId === exId);
                          const col = MUSCLE_COLOR[ex.primaryMuscle] || theme.primary;
                          const isSelected = selectedExercise === exId;
                          const trend = data.history.length >= 2
                            ? data.history[data.history.length - 1].value - data.history[0].value
                            : 0;
                          return (
                            <TouchableOpacity key={exId} onPress={() => setSelectedExercise(isSelected ? null : exId)}>
                              <View style={{ backgroundColor: theme.bgCard, borderRadius: Radius.md, padding: Spacing.md, marginBottom: 8, borderWidth: isSelected ? 2 : 1, borderColor: isSelected ? theme.primary : theme.border }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                  <View style={{ width: 4, alignSelf: 'stretch', backgroundColor: col, borderRadius: 2 }} />
                                  <View style={{ flex: 1 }}>
                                    <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: '800' }}>{ex.name}</Text>
                                    <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 1 }}>
                                      {MUSCLE_ES[ex.primaryMuscle]} · {data.sessions} sesiones
                                    </Text>
                                  </View>
                                  <View style={{ alignItems: 'flex-end', gap: 3 }}>
                                    <Text style={{ color: theme.primary, fontSize: 14, fontWeight: '900' }}>{data.maxWeight}kg</Text>
                                    <Text style={{ color: theme.textMuted, fontSize: 10 }}>media {data.avgLoad}kg</Text>
                                    {trend !== 0 && (
                                      <Text style={{ color: trend > 0 ? theme.success : theme.danger, fontSize: 10, fontWeight: '700' }}>
                                        {trend > 0 ? `+${trend}kg ↑` : `${trend}kg ↓`}
                                      </Text>
                                    )}
                                  </View>
                                  <MiniChart data={data.history.map(h => h.value)} color={col} h={32} />
                                </View>
                              </View>
                            </TouchableOpacity>
                          );
                        })
                      }
                      {computed.topExercises.length > 5 && (
                        <TouchableOpacity onPress={() => setShowAllExercises(v => !v)}
                          style={{ paddingVertical: 12, alignItems: 'center' }}>
                          <Text style={{ color: theme.primary, fontSize: 13, fontWeight: '700' }}>
                            {showAllExercises ? 'Ver menos ↑' : `Ver todos (${computed.topExercises.length}) ↓`}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}

                  {/* ── TIME ── */}
                  {statsTab === 'time' && (
                    <>
                      {/* Day performance */}
                      <Card style={{ marginBottom: Spacing.md }}>
                        <SectionHeader title="Día favorito de la semana" subtitle="Donde más entrenas" />
                        <DayChart counts={computed.dayCounts} />
                        <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 12, textAlign: 'center' }}>
                          {(() => {
                            const days = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
                            const best = computed.dayCounts.indexOf(Math.max(...computed.dayCounts));
                            return `Entrenas más los ${days[best]} (${computed.dayCounts[best]} veces)`;
                          })()}
                        </Text>
                      </Card>

                      {/* Monthly breakdown */}
                      <Card style={{ marginBottom: Spacing.md }}>
                        <SectionHeader title="Entrenos por mes (últimos 6)" />
                        {(() => {
                          const months: { label: string; value: number }[] = [];
                          for (let i = 5; i >= 0; i--) {
                            const d = new Date();
                            d.setMonth(d.getMonth() - i);
                            const y = d.getFullYear(), m = d.getMonth();
                            const count = workouts.filter(w => {
                              const wd = new Date(w.date);
                              return wd.getFullYear() === y && wd.getMonth() === m;
                            }).length;
                            months.push({
                              label: d.toLocaleDateString('es-ES', { month: 'short' }),
                              value: count,
                            });
                          }
                          return <SimpleBarChart data={months} color={theme.secondary} height={100} />;
                        })()}
                      </Card>

                      {/* Duration distribution */}
                      <Card style={{ marginBottom: Spacing.md }}>
                        <SectionHeader title="Duración de sesiones" />
                        <View style={{ gap: 10 }}>
                          {[
                            { lbl: '< 30 min', check: (d: number) => d < 30 },
                            { lbl: '30–60 min', check: (d: number) => d >= 30 && d < 60 },
                            { lbl: '60–90 min', check: (d: number) => d >= 60 && d < 90 },
                            { lbl: '> 90 min', check: (d: number) => d >= 90 },
                          ].map(({ lbl, check }) => {
                            const count = workouts.filter(w => check(w.duration)).length;
                            const pct = workouts.length > 0 ? count / workouts.length : 0;
                            return (
                              <View key={lbl}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                  <Text style={{ color: theme.textPrimary, fontSize: 13 }}>{lbl}</Text>
                                  <Text style={{ color: theme.primary, fontSize: 13, fontWeight: '700' }}>{count} ({Math.round(pct * 100)}%)</Text>
                                </View>
                                <View style={{ height: 8, backgroundColor: theme.bgSunken, borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: theme.border }}>
                                  <LinearGradient colors={[theme.primary + '88', theme.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={{ width: `${pct * 100}%` as any, height: 8, borderRadius: 4 }} />
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      </Card>

                      {/* PR timeline */}
                      {prs.length > 0 && (
                        <Card>
                          <SectionHeader title="Récords personales" subtitle="Peso máximo real registrado" />
                          {prs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8).map(pr => {
                            const ex = exercises.find(e => e.id === pr.exerciseId);
                            if (!ex) return null;
                            return (
                              <View key={pr.exerciseId} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                                <View style={{ flex: 1 }}>
                                  <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: '700' }}>{ex.name}</Text>
                                  <Text style={{ color: theme.textMuted, fontSize: 11 }}>{pr.reps} reps · 1RM est. {pr.estimated1RM}kg</Text>
                                </View>
                                <Text style={{ color: theme.primary, fontSize: 20, fontWeight: '900' }}>{pr.weight}kg</Text>
                              </View>
                            );
                          })}
                        </Card>
                      )}
                    </>
                  )}
                </>
              )
            }
          </>
        )}
      </ScrollView>
    </View>
  );
}
