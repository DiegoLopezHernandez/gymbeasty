import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useGymStore } from '../../src/store/gymStore';
import { Button, useTheme } from '../../src/components/ui';
import { Spacing, Radius, getShadow } from '../../src/constants/theme';
import { EXERCISE_DB } from '../../src/constants/exercises';

export default function StartWorkoutScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { routines, startWorkout } = useGymStore();
  const [customName, setCustomName] = useState('');

  const startCustom = () => {
    if (!customName.trim()) return;
    startWorkout(customName.trim());
    router.push('/workout/active');
  };

  const startRoutine = (r: typeof routines[0]) => {
    startWorkout(r.name, r.id);
    router.push('/workout/active');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.bg }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={theme.mode === 'dark' ? [theme.primary + 'AA', '#181B20'] : [theme.primary + '77', '#ECEAE5']}
        style={{ paddingTop: 56, paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>← Volver</Text>
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -1 }}>Empezar Entreno</Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>Elige una rutina o crea un entreno libre</Text>
      </LinearGradient>

      <View style={{ paddingHorizontal: Spacing.md, paddingTop: Spacing.lg }}>
        {/* Custom workout */}
        <View style={{ backgroundColor: theme.bgCard, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: theme.border, marginBottom: Spacing.lg, ...getShadow(theme) }}>
          <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: 12 }}>🏋️ Entreno libre</Text>
          <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 }}>NOMBRE DEL ENTRENO</Text>
          <TextInput
            style={{ backgroundColor: theme.bgElevated, borderWidth: 1, borderColor: theme.border, borderRadius: Radius.md, padding: 12, fontSize: 15, color: theme.textPrimary, marginBottom: 12 }}
            value={customName} onChangeText={setCustomName}
            placeholder="Ej: Pecho y Tríceps, Piernas, Fullbody..." placeholderTextColor={theme.textMuted} />
          <Button title="▶ Empezar entreno libre" onPress={startCustom} disabled={!customName.trim()} fullWidth />
        </View>

        {/* Routines */}
        {routines.length > 0 && (
          <>
            <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '900', marginBottom: 14 }}>📋 Mis rutinas</Text>
            {routines.map(r => {
              const muscles = [...new Set(r.exercises.map(re => EXERCISE_DB.find(e => e.id === re.exerciseId)?.primaryMuscle).filter(Boolean))];
              return (
                <TouchableOpacity key={r.id} onPress={() => startRoutine(r)}
                  style={{ backgroundColor: theme.bgCard, borderRadius: Radius.lg, marginBottom: Spacing.sm, borderWidth: 1, borderColor: theme.border, overflow: 'hidden', ...getShadow(theme) }}>
                  <LinearGradient colors={[theme.primary + '44', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 3 }} />
                  <View style={{ padding: Spacing.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ color: theme.textPrimary, fontSize: 17, fontWeight: '800', flex: 1 }}>{r.name}</Text>
                      <View style={{ backgroundColor: theme.primary, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 6 }}>
                        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>▶ Iniciar</Text>
                      </View>
                    </View>
                    <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 6 }}>
                      {r.exercises.length} ejercicios · {muscles.slice(0, 3).join(', ')}{muscles.length > 3 ? '...' : ''}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {r.exercises.slice(0, 4).map(re => {
                        const ex = EXERCISE_DB.find(e => e.id === re.exerciseId);
                        return ex ? (
                          <View key={re.exerciseId} style={{ backgroundColor: theme.bgElevated, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: theme.border }}>
                            <Text style={{ color: theme.textSecondary, fontSize: 10 }}>{ex.name}</Text>
                          </View>
                        ) : null;
                      })}
                      {r.exercises.length > 4 && (
                        <View style={{ backgroundColor: theme.bgElevated, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3 }}>
                          <Text style={{ color: theme.textMuted, fontSize: 10 }}>+{r.exercises.length - 4} más</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {routines.length === 0 && (
          <View style={{ alignItems: 'center', padding: Spacing.xl }}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>📋</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 15, fontWeight: '700', textAlign: 'center' }}>Sin rutinas guardadas</Text>
            <Text style={{ color: theme.textMuted, fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 20 }}>
              Ve a la pestaña Rutinas para crear tus rutinas y aparecerán aquí
            </Text>
            <TouchableOpacity onPress={() => router.push('/tabs/routines')} style={{ marginTop: 16 }}>
              <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 14 }}>Ir a Rutinas →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
