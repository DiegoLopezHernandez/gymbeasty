import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGymStore } from '../../src/store/gymStore';
import { Badge, useTheme } from '../../src/components/ui';
import { Spacing, Radius } from '../../src/constants/theme';
import { EXERCISE_DB } from '../../src/constants/exercises';
import { formatDate, formatDuration, formatWeight, calculate1RM } from '../../src/utils/calculations';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { getWorkoutById, deleteWorkout } = useGymStore();
  const workout = getWorkoutById(id);

  if (!workout) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: theme.textMuted, fontSize: 16 }}>Entreno no encontrado</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: theme.primary, fontSize: 15 }}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalVol = workout.exercises.reduce((a, e) => a + e.sets.reduce((b, s) => b + s.weight * s.reps, 0), 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.bg }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={theme.mode === 'dark' ? [theme.primary + 'AA', '#181B20'] : [theme.primary + '77', '#ECEAE5']}
        style={{ paddingTop: 54, paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 10 }}>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>← Volver</Text>
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 }}>{workout.name}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>{formatDate(workout.date)}</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          {[
            { val: formatDuration(workout.duration), lbl: 'Duración' },
            { val: `${workout.exercises.length}`, lbl: 'Ejercicios' },
            { val: formatWeight(totalVol), lbl: 'Volumen' },
          ].map(({ val, lbl }) => (
            <View key={lbl} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: Radius.md, padding: 10, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>{val}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700' }}>{lbl}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={{ paddingHorizontal: Spacing.md, paddingTop: Spacing.md }}>
        {workout.exercises.map((we, i) => {
          const ex = EXERCISE_DB.find(e => e.id === we.exerciseId);
          const topSet = we.sets.length > 0 ? we.sets.reduce((b, s) => calculate1RM(s.weight, s.reps) > calculate1RM(b.weight, b.reps) ? s : b, we.sets[0]) : null;
          return (
            <View key={we.id} style={{ backgroundColor: theme.bgCard, borderRadius: Radius.lg, marginBottom: Spacing.sm, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' }}>
              <View style={{ width: 3, position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: theme.primary }} />
              <View style={{ padding: Spacing.md, paddingLeft: Spacing.md + 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: '700', flex: 1 }}>{ex?.name || we.exerciseId}</Text>
                  {topSet && <Badge label={`Mejor: ${topSet.weight}kg×${topSet.reps}`} color={theme.primary} />}
                </View>
                <View style={{ flexDirection: 'row', paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: theme.border, marginBottom: 3 }}>
                  <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '700', width: 36 }}>SET</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '700', width: 72 }}>PESO</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '700', width: 60 }}>REPS</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '700', flex: 1 }}>1RM EST.</Text>
                </View>
                {we.sets.map((s, si) => (
                  <View key={s.id} style={{ flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: theme.border + '60' }}>
                    <Text style={{ color: theme.textMuted, fontSize: 12, width: 36 }}>#{si + 1}</Text>
                    <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: '700', width: 72 }}>{s.weight}kg</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 13, width: 60 }}>{s.reps} reps</Text>
                    <Text style={{ color: theme.secondary, fontSize: 12, flex: 1 }}>{calculate1RM(s.weight, s.reps)}kg</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        <TouchableOpacity onPress={() => Alert.alert('Eliminar', `¿Eliminar "${workout.name}"?`, [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: () => { deleteWorkout(workout.id); router.back(); } },
        ])} style={{ marginTop: Spacing.lg, padding: 14, borderRadius: Radius.md, borderWidth: 1, borderColor: theme.danger + '40', alignItems: 'center', backgroundColor: theme.dangerSubtle }}>
          <Text style={{ color: theme.danger, fontWeight: '700', fontSize: 14 }}>🗑️ Eliminar este entreno</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
