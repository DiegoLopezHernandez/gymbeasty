import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useGymStore } from '../../src/store/gymStore';
import { useThemeStore } from '../../src/store/themeStore';
import { Card, SectionHeader, StatBox, Button, Badge, EmptyState, GridBackground, AccentStripe, useTheme } from '../../src/components/ui';
import { AthleteAvatar } from '../../src/components/AthleteAvatar';
import { Spacing, Radius } from '../../src/constants/theme';
import { formatDate, formatDuration, formatWeight, RANK_DATA } from '../../src/utils/calculations';
import ConfigScreen from '../../src/components/ConfigScreen';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { stats, workouts, activeWorkout } = useGymStore();
  const toggleTheme = useThemeStore(s => s.toggleTheme);
  const [showConfig, setShowConfig] = useState(false);

  const recent = [...workouts]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={theme.mode === 'dark' ? [theme.primary + 'CC', '#1A0800', theme.bg] : [theme.primary + '99', '#F5EDE0', theme.bg]}
          locations={[0, 0.45, 1]}
          style={{ paddingTop: 58, paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl }}>
          <GridBackground theme={theme} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', letterSpacing: 1 }}>{greeting.toUpperCase()} 👋</Text>
              <Text style={{ color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: -1, marginTop: 2 }}>GymBeast</Text>
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 3 }}>
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={toggleTheme} style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.full, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}>
                <Text style={{ fontSize: 18 }}>{theme.mode === 'dark' ? '☀️' : '🌙'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowConfig(true)} style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.full, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}>
                <Text style={{ fontSize: 18 }}>⚙️</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: Spacing.md }}>
            {[
              { icon: stats.currentStreak > 0 ? '🔥' : '💤', val: stats.currentStreak.toString(), lbl: 'RACHA' },
              { icon: '⚡', val: stats.xp.toLocaleString(), lbl: 'XP' },
              { icon: '🏋️', val: stats.totalWorkouts.toString(), lbl: 'ENTRENOS' },
            ].map(({ icon, val, lbl }) => (
              <View key={lbl} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: Radius.md, paddingHorizontal: 8, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}>
                <Text style={{ fontSize: 14 }}>{icon}</Text>
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>{val}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '700' }}>{lbl}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: Spacing.md, paddingTop: Spacing.sm }}>
          {activeWorkout ? (
            <TouchableOpacity onPress={() => router.push('/workout/active')} style={{ marginBottom: Spacing.md }}>
              <LinearGradient colors={[theme.primary, theme.primaryLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ borderRadius: Radius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 11, letterSpacing: 1 }}>🔴 ENTRENO EN CURSO</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, fontWeight: '700', marginTop: 2 }}>{activeWorkout.name}</Text>
                </View>
                <Text style={{ color: '#fff', fontSize: 22 }}>→</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <Card glow style={{ marginBottom: Spacing.md }}>
              <GridBackground theme={theme} />
              <AccentStripe theme={theme} style={{ marginBottom: Spacing.md }} />
              <Text style={{ color: theme.textPrimary, fontSize: 20, fontWeight: '900' }}>¿Listo para entrenar?</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4, marginBottom: 14 }}>
                Último: {stats.lastWorkoutDate ? formatDate(stats.lastWorkoutDate) : 'Sin entrenos aún'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button title="▶ Empezar" onPress={() => router.push('/workout/start')} style={{ flex: 2 }} />
                <Button title="+ Manual" onPress={() => router.push('/workout/manual')} variant="ghost" style={{ flex: 1 }} />
              </View>
            </Card>
          )}

          <Card style={{ marginBottom: Spacing.md }}>
            <View style={{ flexDirection: 'row' }}>
              <StatBox value={stats.totalWorkouts.toString()} label="Total" color={theme.primary} icon="🏋️" />
              <StatBox value={formatWeight(stats.totalVolume)} label="Volumen" color={theme.secondary} icon="⚡" />
              <StatBox value={`Lv.${stats.gymLevel}`} label={RANK_DATA[Math.max(0,(stats.gymLevel||1)-1)]?.name?.split(" ")[0] || "Nivel"} color={theme.success} icon={RANK_DATA[Math.max(0,(stats.gymLevel||1)-1)]?.emoji || "🏅"} />
              <StatBox value={formatDuration(stats.totalDuration)} label="Tiempo" color={theme.warning} style={{ borderRightWidth: 0 }} />
            </View>
          </Card>

          <SectionHeader title="Tu Atleta" subtitle="Evoluciona con cada entreno" />
          <AthleteAvatar tier={stats.athleteTier} gymLevel={stats.gymLevel} xp={stats.xp} totalWorkouts={stats.totalWorkouts} streak={stats.currentStreak} />

          <SectionHeader title="Últimos Entrenos" style={{ marginTop: Spacing.lg }}
            action={{ label: 'Ver todo →', onPress: () => router.push('/tabs/history') }} />
          {recent.length === 0
            ? <EmptyState icon="📋" title="Sin entrenos" subtitle="Completa tu primer entreno para verlo aquí" />
            : recent.map(w => (
              <Card key={w.id} accent onPress={() => router.push(`/workout/${w.id}`)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: '800', flex: 1 }}>{w.name}</Text>
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    {w.isManual && <Badge label="Manual" color={theme.textMuted} />}
                    <Badge label={formatDuration(w.duration)} color={theme.secondary} />
                  </View>
                </View>
                <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 3 }}>{formatDate(w.date)}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>
                  {w.exercises.length} ejercicios · {w.exercises.reduce((a, e) => a + e.sets.length, 0)} series
                </Text>
              </Card>
            ))
          }
        </View>
      </ScrollView>

      {/* Config Modal */}
      <Modal visible={showConfig} animationType="slide" onRequestClose={() => setShowConfig(false)}>
        <ConfigScreen onClose={() => setShowConfig(false)} />
      </Modal>
    </View>
  );
}
