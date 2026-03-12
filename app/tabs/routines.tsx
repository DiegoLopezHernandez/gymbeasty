import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useGymStore } from '../../src/store/gymStore';
import { Button, Badge, EmptyState, SectionHeader, useTheme } from '../../src/components/ui';
import { Spacing, Radius, getShadow } from '../../src/constants/theme';
import { generateId } from '../../src/utils/calculations';
import { Routine, RoutineExercise } from '../../src/types';

const MUSCLES = [
  { key: 'chest', label: 'Pecho' }, { key: 'back', label: 'Espalda' }, { key: 'lats', label: 'Dorsales' },
  { key: 'shoulders', label: 'Hombros' }, { key: 'biceps', label: 'Bíceps' }, { key: 'triceps', label: 'Tríceps' },
  { key: 'quads', label: 'Cuádriceps' }, { key: 'hamstrings', label: 'Femoral' }, { key: 'glutes', label: 'Glúteos' }, { key: 'abs', label: 'Abdomen' },
];

export default function RoutinesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { routines, addRoutine, updateRoutine, deleteRoutine, startWorkout, exercises: storeExercises } = useGymStore();

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [routineName, setRoutineName] = useState('');
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [showExPicker, setShowExPicker] = useState(false);
  const [filterMuscle, setFilterMuscle] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const openCreate = () => { setEditingId(null); setRoutineName(''); setExercises([]); setShowCreate(true); };
  const openEdit = (r: Routine) => { setEditingId(r.id); setRoutineName(r.name); setExercises([...r.exercises]); setShowCreate(true); };

  const saveRoutine = () => {
    if (!routineName.trim() || exercises.length === 0) return;
    if (editingId) updateRoutine(editingId, { name: routineName.trim(), exercises });
    else addRoutine({ id: generateId(), name: routineName.trim(), exercises, createdAt: new Date().toISOString() });
    setShowCreate(false);
  };

  const addEx = (exId: string) => {
    if (exercises.find(e => e.exerciseId === exId)) return;
    setExercises(p => [...p, { exerciseId: exId, targetSets: 3, targetReps: '8-12', restSeconds: 90 }]);
    setShowExPicker(false);
  };

  const filteredEx = storeExercises.filter(e =>
    (!filterMuscle || e.primaryMuscle === filterMuscle) &&
    (!search || e.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <LinearGradient colors={theme.mode === 'dark' ? ['#001533','#181B20'] : ['#E8F0FF','#ECEAE5']}
        style={{ paddingTop: 56, paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Text style={{ color: theme.textPrimary, fontSize: 28, fontWeight: '900', letterSpacing: -1 }}>Mis Rutinas</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 3 }}>{routines.length} rutinas guardadas</Text>
          </View>
          <Button title="+ Nueva" onPress={openCreate} size="sm" />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {routines.length === 0
          ? <EmptyState icon="📋" title="Sin rutinas" subtitle="Crea tu primera rutina con los ejercicios que quieras y empieza a entrenar con un plan." action={{ label: '+ Crear rutina', onPress: openCreate }} />
          : routines.map(r => (
            <View key={r.id} style={{ backgroundColor: theme.bgCard, borderRadius: Radius.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: theme.border, overflow: 'hidden', ...getShadow(theme) }}>
              <LinearGradient colors={[theme.primary + '55', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 3 }} />
              <View style={{ padding: Spacing.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '900', flex: 1 }}>{r.name}</Text>
                  <Badge label={`${r.exercises.length} ejerc.`} color={theme.primary} />
                </View>
                {r.exercises.slice(0, 6).map((re, i) => {
                  const ex = storeExercises.find(e => e.id === re.exerciseId);
                  return (
                    <View key={re.exerciseId} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.primary, marginRight: 10 }} />
                      <Text style={{ color: theme.textSecondary, fontSize: 13, flex: 1 }}>{ex?.name || re.exerciseId}</Text>
                      <Text style={{ color: theme.textMuted, fontSize: 11 }}>{re.targetSets}×{re.targetReps}</Text>
                    </View>
                  );
                })}
                {r.exercises.length > 6 && <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 4, textAlign: 'center' }}>+{r.exercises.length - 6} más...</Text>}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                  <Button title="▶ Iniciar" size="sm" style={{ flex: 2 }} onPress={() => {
                    startWorkout(r.name, r.id);
                    router.push('/workout/active');
                  }} />
                  <Button title="✏️" variant="ghost" size="sm" style={{ flex: 1 }} onPress={() => openEdit(r)} />
                  <TouchableOpacity onPress={() => Alert.alert('Eliminar', `¿Eliminar "${r.name}"?`, [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Eliminar', style: 'destructive', onPress: () => deleteRoutine(r.id) },
                  ])} style={{ width: 40, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 20 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        }
      </ScrollView>

      {/* ── Create / Edit Modal ── */}
      <Modal visible={showCreate} animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
          <LinearGradient colors={theme.mode === 'dark' ? ['#001533','#181B20'] : ['#E8F0FF','#ECEAE5']}
            style={{ paddingTop: 56, paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: theme.textPrimary, fontSize: 22, fontWeight: '900' }}>
                {editingId ? 'Editar Rutina' : 'Nueva Rutina'}
              </Text>
              <TouchableOpacity onPress={() => setShowCreate(false)} style={{ padding: 4 }}>
                <Text style={{ color: theme.textSecondary, fontSize: 26 }}>✕</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.md, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
            <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 }}>NOMBRE</Text>
            <TextInput
              style={{ backgroundColor: theme.bgElevated, borderWidth: 1, borderColor: theme.border, borderRadius: Radius.md, padding: 14, fontSize: 16, color: theme.textPrimary, marginBottom: Spacing.lg, fontWeight: '700' }}
              value={routineName} onChangeText={setRoutineName}
              placeholder="Ej: Pecho y Tríceps, Piernas, Push A..." placeholderTextColor={theme.textMuted} autoFocus />

            <SectionHeader title={`Ejercicios (${exercises.length})`}
              action={{ label: '+ Añadir', onPress: () => setShowExPicker(true) }} />

            {exercises.length === 0 && (
              <TouchableOpacity onPress={() => setShowExPicker(true)}
                style={{ borderWidth: 2, borderColor: theme.border, borderStyle: 'dashed', borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.md }}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>➕</Text>
                <Text style={{ color: theme.textMuted, fontSize: 14 }}>Toca para añadir ejercicios</Text>
              </TouchableOpacity>
            )}

            {exercises.map((re) => {
              const ex = storeExercises.find(e => e.id === re.exerciseId);
              return (
                <View key={re.exerciseId} style={{ backgroundColor: theme.bgCard, borderRadius: Radius.md, padding: Spacing.md, marginBottom: 8, borderWidth: 1, borderColor: theme.border }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: '700' }}>{ex?.name}</Text>
                      <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2, textTransform: 'capitalize' }}>{ex?.primaryMuscle} · {ex?.equipment}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setExercises(p => p.filter(e => e.exerciseId !== re.exerciseId))} style={{ padding: 4 }}>
                      <Text style={{ color: theme.danger, fontSize: 18 }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '700', marginBottom: 5 }}>SERIES</Text>
                      <View style={{ flexDirection: 'row', gap: 5 }}>
                        {[2, 3, 4, 5].map(n => (
                          <TouchableOpacity key={n} onPress={() => setExercises(p => p.map(e => e.exerciseId === re.exerciseId ? { ...e, targetSets: n } : e))}
                            style={{ flex: 1, paddingVertical: 8, borderRadius: Radius.sm, alignItems: 'center', backgroundColor: re.targetSets === n ? theme.primary : theme.bgElevated, borderWidth: 1, borderColor: re.targetSets === n ? theme.primary : theme.border }}>
                            <Text style={{ color: re.targetSets === n ? '#fff' : theme.textSecondary, fontWeight: '700', fontSize: 13 }}>{n}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '700', marginBottom: 5 }}>REPS</Text>
                      <View style={{ flexDirection: 'row', gap: 4 }}>
                        {['5-6', '8-10', '10-12', '15+'].map(r => (
                          <TouchableOpacity key={r} onPress={() => setExercises(p => p.map(e => e.exerciseId === re.exerciseId ? { ...e, targetReps: r } : e))}
                            style={{ flex: 1, paddingVertical: 8, borderRadius: Radius.sm, alignItems: 'center', backgroundColor: re.targetReps === r ? theme.secondary : theme.bgElevated, borderWidth: 1, borderColor: re.targetReps === r ? theme.secondary : theme.border }}>
                            <Text style={{ color: re.targetReps === r ? '#fff' : theme.textSecondary, fontWeight: '700', fontSize: 10 }}>{r}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}

            {exercises.length > 0 && (
              <TouchableOpacity onPress={() => setShowExPicker(true)}
                style={{ borderWidth: 1, borderColor: theme.primary + '60', borderStyle: 'dashed', borderRadius: Radius.md, padding: 12, alignItems: 'center', marginTop: 4 }}>
                <Text style={{ color: theme.primary, fontWeight: '600' }}>+ Añadir otro ejercicio</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <View style={{ padding: Spacing.md, borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.bg }}>
            <Button title={editingId ? '💾 Guardar cambios' : '✅ Crear rutina'} onPress={saveRoutine} fullWidth size="lg"
              disabled={!routineName.trim() || exercises.length === 0} />
          </View>
        </View>
      </Modal>

      {/* ── Exercise Picker Modal ── */}
      <Modal visible={showExPicker} animationType="slide" onRequestClose={() => setShowExPicker(false)}>
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
          <View style={{ paddingTop: 56, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: theme.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: theme.textPrimary, fontSize: 20, fontWeight: '900' }}>Añadir ejercicio</Text>
              <TouchableOpacity onPress={() => setShowExPicker(false)}>
                <Text style={{ color: theme.textSecondary, fontSize: 26 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={{ backgroundColor: theme.bgElevated, borderWidth: 1, borderColor: theme.border, borderRadius: Radius.md, padding: 12, fontSize: 14, color: theme.textPrimary, marginBottom: 10 }}
              value={search} onChangeText={setSearch} placeholder="Buscar ejercicio..." placeholderTextColor={theme.textMuted} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[{ key: null, label: 'Todos' }, ...MUSCLES].map(mg => (
                <TouchableOpacity key={String(mg.key)} onPress={() => setFilterMuscle(mg.key as any)}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, marginRight: 6, backgroundColor: filterMuscle === mg.key ? theme.primary : theme.bgElevated, borderWidth: 1, borderColor: filterMuscle === mg.key ? theme.primary : theme.border }}>
                  <Text style={{ color: filterMuscle === mg.key ? '#fff' : theme.textSecondary, fontSize: 12, fontWeight: '600' }}>{mg.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {filteredEx.map(ex => {
              const added = exercises.some(e => e.exerciseId === ex.id);
              return (
                <TouchableOpacity key={ex.id} onPress={() => !added && addEx(ex.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.border, opacity: added ? 0.4 : 1 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: '600' }}>{ex.name}</Text>
                    <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2, textTransform: 'capitalize' }}>{ex.primaryMuscle} · {ex.equipment}</Text>
                  </View>
                  {added
                    ? <Text style={{ color: theme.success, fontSize: 12, fontWeight: '700' }}>✓ Añadido</Text>
                    : <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#fff', fontSize: 18, lineHeight: 22 }}>+</Text>
                      </View>
                  }
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
