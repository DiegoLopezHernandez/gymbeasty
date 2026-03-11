import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGymStore } from '../store/gymStore';
import { useThemeStore } from '../store/themeStore';
import { Button, Badge, SectionHeader, useTheme } from './ui';
import { Spacing, Radius } from '../constants/theme';
import { EXERCISE_DB } from '../constants/exercises';
import { generateId } from '../utils/calculations';
import { Exercise, MuscleGroup, ExerciseCategory } from '../types';

const MUSCLES: { key: MuscleGroup; label: string }[] = [
  { key: 'chest', label: 'Pecho' }, { key: 'back', label: 'Espalda' }, { key: 'lats', label: 'Dorsales' },
  { key: 'shoulders', label: 'Hombros' }, { key: 'biceps', label: 'Bíceps' }, { key: 'triceps', label: 'Tríceps' },
  { key: 'quads', label: 'Cuádriceps' }, { key: 'hamstrings', label: 'Femoral' }, { key: 'glutes', label: 'Glúteos' },
  { key: 'abs', label: 'Abdomen' }, { key: 'calves', label: 'Gemelos' }, { key: 'traps', label: 'Trapecios' },
  { key: 'forearms', label: 'Antebrazos' },
];

const CATEGORIES: { key: ExerciseCategory; label: string }[] = [
  { key: 'compound', label: 'Compuesto' }, { key: 'isolation', label: 'Aislamiento' },
  { key: 'cardio', label: 'Cardio' }, { key: 'stretching', label: 'Estiramiento' },
];

const EQUIPMENT = ['Barra', 'Mancuernas', 'Máquina', 'Poleas', 'Peso corporal', 'Bandas', 'Kettlebell', 'Otro'];

interface Props { onClose: () => void; }

export default function ConfigScreen({ onClose }: Props) {
  const theme = useTheme();
  const toggleTheme = useThemeStore(s => s.toggleTheme);
  const themeMode = useThemeStore(s => s.theme.mode);
  const { exercises, addExercise, updateExercise, deleteCustomExercise, clearAllData } = useGymStore();

  const [tab, setTab] = useState<'exercises' | 'data'>('exercises');
  const [showExModal, setShowExModal] = useState(false);
  const [editingEx, setEditingEx] = useState<Exercise | null>(null);

  // form fields
  const [exName, setExName] = useState('');
  const [exMuscle, setExMuscle] = useState<MuscleGroup>('chest');
  const [exSecondary, setExSecondary] = useState<MuscleGroup[]>([]);
  const [exCategory, setExCategory] = useState<ExerciseCategory>('compound');
  const [exEquipment, setExEquipment] = useState('Barra');
  const [exDesc, setExDesc] = useState('');
  const [exSearch, setExSearch] = useState('');

  const openCreate = () => {
    setEditingEx(null); setExName(''); setExMuscle('chest'); setExSecondary([]);
    setExCategory('compound'); setExEquipment('Barra'); setExDesc('');
    setShowExModal(true);
  };

  const openEdit = (ex: Exercise) => {
    setEditingEx(ex); setExName(ex.name); setExMuscle(ex.primaryMuscle); setExSecondary(ex.secondaryMuscles);
    setExCategory(ex.category); setExEquipment(ex.equipment); setExDesc(ex.description || '');
    setShowExModal(true);
  };

  const saveEx = () => {
    if (!exName.trim() || !exDesc.trim()) { Alert.alert('Campos obligatorios', 'Nombre y descripción son obligatorios'); return; }
    const data: Exercise = {
      id: editingEx?.id || `custom_${generateId()}`,
      name: exName.trim(), primaryMuscle: exMuscle, secondaryMuscles: exSecondary,
      category: exCategory, equipment: exEquipment, description: exDesc.trim(), isCustom: true,
    };
    if (editingEx) updateExercise(editingEx.id, data);
    else addExercise(data);
    setShowExModal(false);
  };

  const toggleSecondary = (m: MuscleGroup) => {
    if (m === exMuscle) return;
    setExSecondary(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m]);
  };

  const customExercises = exercises.filter(e => e.isCustom);
  const filteredEx = exercises.filter(e =>
    !exSearch || e.name.toLowerCase().includes(exSearch.toLowerCase())
  );

  const exportCSV = () => {
    const { workouts } = useGymStore.getState();
    const rows = ['Fecha,Nombre,Ejercicio,Serie,Peso,Reps'];
    workouts.forEach(w => w.exercises.forEach(we => {
      const ex = exercises.find(e => e.id === we.exerciseId);
      we.sets.forEach((s, i) => rows.push(`${w.date.slice(0,10)},${w.name},${ex?.name || we.exerciseId},${i+1},${s.weight},${s.reps}`));
    }));
    Alert.alert('CSV generado', `${rows.length - 1} filas. En una build real esto se exportaría al almacenamiento.`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <LinearGradient colors={theme.mode === 'dark' ? ['#0A0A1A','#181B20'] : ['#E8E8F5','#ECEAE5']}
        style={{ paddingTop: 56, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Text style={{ color: theme.textPrimary, fontSize: 26, fontWeight: '900' }}>⚙️ Configuración</Text>
          <TouchableOpacity onPress={onClose}><Text style={{ color: theme.textSecondary, fontSize: 26 }}>✕</Text></TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', backgroundColor: theme.bgElevated, borderRadius: Radius.md, padding: 3, gap: 3, borderWidth: 1, borderColor: theme.border }}>
          {([['exercises','💪 Ejercicios'],['data','📦 Datos']] as const).map(([t, label]) => (
            <TouchableOpacity key={t} onPress={() => setTab(t)}
              style={{ flex: 1, paddingVertical: 8, borderRadius: Radius.sm - 2, alignItems: 'center', backgroundColor: tab === t ? theme.bgCard : 'transparent', borderWidth: tab === t ? 1 : 0, borderColor: tab === t ? theme.primary + '40' : 'transparent' }}>
              <Text style={{ color: tab === t ? theme.primary : theme.textMuted, fontSize: 12, fontWeight: '700' }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {tab === 'exercises' && (
          <>
            {/* Theme toggle */}
            <TouchableOpacity onPress={toggleTheme}
              style={{ backgroundColor: theme.bgCard, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md }}>
              <View>
                <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: '700' }}>
                  {themeMode === 'dark' ? '☀️ Cambiar a modo claro' : '🌙 Cambiar a modo oscuro'}
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>Actualmente: {themeMode === 'dark' ? 'Oscuro' : 'Claro'}</Text>
              </View>
              <Text style={{ fontSize: 22 }}>{themeMode === 'dark' ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>

            <SectionHeader title="Mis Ejercicios" action={{ label: '+ Crear', onPress: openCreate }} />

            <TextInput
              style={{ backgroundColor: theme.bgElevated, borderWidth: 1, borderColor: theme.border, borderRadius: Radius.md, padding: 12, fontSize: 14, color: theme.textPrimary, marginBottom: Spacing.md }}
              value={exSearch} onChangeText={setExSearch} placeholder="Buscar ejercicio..." placeholderTextColor={theme.textMuted} />

            {customExercises.length > 0 && (
              <>
                <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 }}>MIS EJERCICIOS PERSONALIZADOS</Text>
                {customExercises.filter(e => !exSearch || e.name.toLowerCase().includes(exSearch.toLowerCase())).map(ex => (
                  <View key={ex.id} style={{ backgroundColor: theme.bgCard, borderRadius: Radius.md, padding: Spacing.md, marginBottom: 8, borderWidth: 1, borderColor: theme.borderAccent, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: '700' }}>{ex.name}</Text>
                      <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>{MUSCLES.find(m => m.key === ex.primaryMuscle)?.label} · {ex.equipment}</Text>
                      {ex.description && <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 3 }}>{ex.description}</Text>}
                    </View>
                    <TouchableOpacity onPress={() => openEdit(ex)} style={{ padding: 8 }}><Text style={{ fontSize: 18 }}>✏️</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => Alert.alert('Eliminar', `¿Eliminar "${ex.name}"?`, [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Eliminar', style: 'destructive', onPress: () => deleteCustomExercise(ex.id) },
                    ])} style={{ padding: 8 }}><Text style={{ fontSize: 18 }}>🗑️</Text></TouchableOpacity>
                  </View>
                ))}
              </>
            )}

            {exSearch && (
              <>
                <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginTop: Spacing.md }}>TODOS LOS EJERCICIOS</Text>
                {filteredEx.filter(e => !e.isCustom).slice(0, 10).map(ex => (
                  <View key={ex.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: '600' }}>{ex.name}</Text>
                      <Text style={{ color: theme.textMuted, fontSize: 11 }}>{MUSCLES.find(m => m.key === ex.primaryMuscle)?.label} · {ex.equipment}</Text>
                    </View>
                    <Badge label="Base" color={theme.textMuted} />
                  </View>
                ))}
              </>
            )}

            {customExercises.length === 0 && !exSearch && (
              <View style={{ alignItems: 'center', padding: Spacing.xl }}>
                <Text style={{ fontSize: 44, marginBottom: 12 }}>💪</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 15, fontWeight: '700', textAlign: 'center' }}>Sin ejercicios personalizados</Text>
                <Text style={{ color: theme.textMuted, fontSize: 13, textAlign: 'center', marginTop: 6 }}>Crea ejercicios propios que aparecerán en todas las rutinas</Text>
                <Button title="+ Crear ejercicio" onPress={openCreate} style={{ marginTop: 16 }} />
              </View>
            )}
          </>
        )}

        {tab === 'data' && (
          <>
            <SectionHeader title="Exportar datos" />
            <TouchableOpacity onPress={exportCSV}
              style={{ backgroundColor: theme.bgCard, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md }}>
              <View>
                <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: '700' }}>📤 Exportar a CSV</Text>
                <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>Exporta todos tus entrenos y series</Text>
              </View>
              <Text style={{ fontSize: 22 }}>→</Text>
            </TouchableOpacity>

            <SectionHeader title="Zona de peligro" style={{ marginTop: Spacing.lg }} />
            <TouchableOpacity onPress={() => Alert.alert('⚠️ Eliminar todos los datos', 'Esto eliminará TODOS tus entrenos, récords, objetivos y peso corporal. Esta acción no se puede deshacer.', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'ELIMINAR TODO', style: 'destructive', onPress: () => { clearAllData(); onClose(); } },
            ])}
              style={{ backgroundColor: theme.dangerSubtle, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: theme.danger + '40', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ color: theme.danger, fontSize: 15, fontWeight: '700' }}>🗑️ Borrar todos los datos</Text>
                <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>No se puede deshacer</Text>
              </View>
              <Text style={{ fontSize: 22 }}>⚠️</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Exercise Create/Edit Modal */}
      <Modal visible={showExModal} animationType="slide" onRequestClose={() => setShowExModal(false)}>
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
          <View style={{ paddingTop: 56, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: theme.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: theme.textPrimary, fontSize: 20, fontWeight: '900' }}>{editingEx ? 'Editar ejercicio' : 'Nuevo ejercicio'}</Text>
              <TouchableOpacity onPress={() => setShowExModal(false)}><Text style={{ color: theme.textSecondary, fontSize: 26 }}>✕</Text></TouchableOpacity>
            </View>
          </View>
          <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

            {/* Name */}
            <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 5 }}>NOMBRE *</Text>
            <TextInput style={{ backgroundColor: theme.bgElevated, borderWidth: 1, borderColor: theme.border, borderRadius: Radius.md, padding: 12, fontSize: 15, color: theme.textPrimary, marginBottom: Spacing.md }}
              value={exName} onChangeText={setExName} placeholder="Ej: Press Banca con Agarre Ancho" placeholderTextColor={theme.textMuted} autoFocus />

            {/* Description */}
            <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 5 }}>DESCRIPCIÓN * <Text style={{ color: theme.danger }}>(obligatorio)</Text></Text>
            <TextInput style={{ backgroundColor: theme.bgElevated, borderWidth: 1, borderColor: exDesc.trim() ? theme.border : theme.danger + '60', borderRadius: Radius.md, padding: 12, fontSize: 14, color: theme.textPrimary, marginBottom: Spacing.md, minHeight: 80, textAlignVertical: 'top' }}
              value={exDesc} onChangeText={setExDesc} placeholder="Para qué sirve, cómo se ejecuta, músculos implicados..." placeholderTextColor={theme.textMuted} multiline />

            {/* Primary muscle */}
            <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 }}>MÚSCULO PRINCIPAL *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              {MUSCLES.map(m => (
                <TouchableOpacity key={m.key} onPress={() => { setExMuscle(m.key); setExSecondary(p => p.filter(x => x !== m.key)); }}
                  style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, marginRight: 6, backgroundColor: exMuscle === m.key ? theme.primary : theme.bgElevated, borderWidth: 1, borderColor: exMuscle === m.key ? theme.primary : theme.border }}>
                  <Text style={{ color: exMuscle === m.key ? '#fff' : theme.textSecondary, fontSize: 12, fontWeight: '600' }}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Secondary muscles */}
            <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 }}>MÚSCULOS SECUNDARIOS</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.md }}>
              {MUSCLES.filter(m => m.key !== exMuscle).map(m => (
                <TouchableOpacity key={m.key} onPress={() => toggleSecondary(m.key)}
                  style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full, backgroundColor: exSecondary.includes(m.key) ? theme.secondary : theme.bgElevated, borderWidth: 1, borderColor: exSecondary.includes(m.key) ? theme.secondary : theme.border }}>
                  <Text style={{ color: exSecondary.includes(m.key) ? '#fff' : theme.textSecondary, fontSize: 11, fontWeight: '600' }}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category */}
            <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 }}>CATEGORÍA *</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: Spacing.md }}>
              {CATEGORIES.map(c => (
                <TouchableOpacity key={c.key} onPress={() => setExCategory(c.key)}
                  style={{ flex: 1, paddingVertical: 9, borderRadius: Radius.md, alignItems: 'center', backgroundColor: exCategory === c.key ? theme.primary : theme.bgElevated, borderWidth: 1, borderColor: exCategory === c.key ? theme.primary : theme.border }}>
                  <Text style={{ color: exCategory === c.key ? '#fff' : theme.textSecondary, fontSize: 11, fontWeight: '700' }}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Equipment */}
            <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 }}>EQUIPO *</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.xl }}>
              {EQUIPMENT.map(eq => (
                <TouchableOpacity key={eq} onPress={() => setExEquipment(eq)}
                  style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: exEquipment === eq ? theme.primary : theme.bgElevated, borderWidth: 1, borderColor: exEquipment === eq ? theme.primary : theme.border }}>
                  <Text style={{ color: exEquipment === eq ? '#fff' : theme.textSecondary, fontSize: 12, fontWeight: '600' }}>{eq}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <View style={{ padding: Spacing.md, borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.bg }}>
            <Button title={editingEx ? '💾 Guardar cambios' : '✅ Crear ejercicio'} onPress={saveEx} fullWidth size="lg"
              disabled={!exName.trim() || !exDesc.trim()} />
          </View>
        </View>
      </Modal>
    </View>
  );
}
