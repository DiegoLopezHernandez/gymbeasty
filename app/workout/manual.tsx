import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useGymStore } from '../../src/store/gymStore';
import { Button, Badge, SectionHeader, useTheme } from '../../src/components/ui';
import { Spacing, Radius } from '../../src/constants/theme';
import { generateId } from '../../src/utils/calculations';
import { WorkoutExercise, WorkoutSet, Workout } from '../../src/types';

const MUSCLE_LABELS: Record<string, string> = {
  chest:'Pecho', back:'Espalda', lats:'Dorsales', shoulders:'Hombros', biceps:'Bíceps',
  triceps:'Tríceps', quads:'Cuádriceps', hamstrings:'Femoral', glutes:'Glúteos',
  abs:'Abdomen', calves:'Gemelos', traps:'Trapecios', forearms:'Antebrazos',
};

export default function ManualWorkoutScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { exercises, routines, addWorkout, checkAndUpdatePR } = useGymStore();

  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [durationH, setDurationH] = useState('1');
  const [durationM, setDurationM] = useState('0');
  const [selectedRoutine, setSelectedRoutine] = useState<string | null>(null);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [showExPicker, setShowExPicker] = useState(false);
  const [exSearch, setExSearch] = useState('');
  const [exMuscleFilter, setExMuscleFilter] = useState('all');
  const [editing, setEditing] = useState<{ei:number;si:number;field:'weight'|'reps';val:string}|null>(null);

  const loadRoutine = (routineId: string) => {
    setSelectedRoutine(routineId);
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;
    if (!name) setName(routine.name);
    const exs: WorkoutExercise[] = routine.exercises.map(re => ({
      id: generateId(), exerciseId: re.exerciseId,
      sets: Array.from({ length: re.targetSets }, () => ({
        id: generateId(), exerciseId: re.exerciseId,
        weight: 0, reps: typeof re.targetReps === 'string' ? parseInt(re.targetReps) || 0 : re.targetReps || 0,
        completedAt: new Date(date).toISOString(),
      })),
    }));
    setWorkoutExercises(exs);
  };

  const addEx = (exId: string) => {
    setWorkoutExercises(p => [...p, {
      id: generateId(), exerciseId: exId,
      sets: [{ id: generateId(), exerciseId: exId, weight: 0, reps: 0, completedAt: new Date(date).toISOString() }],
    }]);
    setShowExPicker(false);
  };

  const removeEx = (ei: number) => setWorkoutExercises(p => p.filter((_,i)=>i!==ei));

  const addSet = (ei: number) => setWorkoutExercises(p => p.map((e,i) => i!==ei ? e : {
    ...e, sets: [...e.sets, { id: generateId(), exerciseId: e.exerciseId, weight: e.sets[e.sets.length-1]?.weight||0, reps: e.sets[e.sets.length-1]?.reps||0, completedAt: new Date(date).toISOString() }],
  }));

  const removeSet = (ei: number, si: number) => setWorkoutExercises(p => p.map((e,i) => i!==ei ? e : { ...e, sets: e.sets.filter((_,j)=>j!==si) }));

  const commitEdit = () => {
    if (!editing) return;
    const val = parseFloat(editing.val);
    if (!isNaN(val)) setWorkoutExercises(p => p.map((e,i) => i!==editing.ei ? e : { ...e, sets: e.sets.map((s,j) => j!==editing.si ? s : { ...s, [editing.field]: val }) }));
    setEditing(null);
  };

  const save = () => {
    if (!name.trim()) { Alert.alert('Nombre requerido', 'Añade un nombre al entreno'); return; }
    if (workoutExercises.length === 0) { Alert.alert('Sin ejercicios', 'Añade al menos un ejercicio'); return; }
    const h = parseInt(durationH) || 0;
    const m = parseInt(durationM) || 0;
    const totalMin = h * 60 + m;
    if (totalMin <= 0) { Alert.alert('Duración inválida', 'Introduce una duración válida'); return; }
    const dateObj = new Date(date + 'T12:00:00');
    const workout: Workout = {
      id: generateId(), name: name.trim(),
      date: dateObj.toISOString(), duration: totalMin,
      exercises: workoutExercises, isManual: true,
    };
    addWorkout(workout);
    workoutExercises.forEach(we => we.sets.forEach(s => { if (s.weight > 0 && s.reps > 0) checkAndUpdatePR(we.exerciseId, s.weight, s.reps); }));
    Alert.alert('✅ Guardado', 'Entreno añadido al historial', [{ text: 'OK', onPress: () => router.replace('/') }]);
  };

  const uniqueMuscles = ['all', ...Array.from(new Set(exercises.map(e => e.primaryMuscle)))];
  const filteredEx = exercises.filter(e => {
    const matchSearch = !exSearch || e.name.toLowerCase().includes(exSearch.toLowerCase());
    const matchMuscle = exMuscleFilter === 'all' || e.primaryMuscle === exMuscleFilter;
    return matchSearch && matchMuscle;
  });

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <LinearGradient colors={theme.mode==='dark' ? [theme.secondary+'99','#181B20'] : [theme.secondary+'66','#ECEAE5']}
        style={{ paddingTop: 54, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md }}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width:36, height:36, borderRadius:18, backgroundColor:'rgba(0,0,0,0.2)', alignItems:'center', justifyContent:'center' }}>
            <Text style={{ color:'#fff', fontSize:18 }}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={{ color:'rgba(255,255,255,0.75)', fontSize:11, fontWeight:'700', letterSpacing:1 }}>📝 ENTRENO MANUAL</Text>
            <Text style={{ color:'#fff', fontSize:20, fontWeight:'900' }}>Añadir entreno pasado</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 120 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Basic info */}
        <View style={{ backgroundColor: theme.bgCard, borderRadius: Radius.lg, padding: Spacing.md, borderWidth:1, borderColor:theme.border, marginBottom: Spacing.md }}>
          <Text style={{ color:theme.textMuted, fontSize:11, fontWeight:'700', letterSpacing:0.8, marginBottom:6 }}>NOMBRE DEL ENTRENO *</Text>
          <TextInput style={{ backgroundColor:theme.bgElevated, borderWidth:1, borderColor:theme.border, borderRadius:Radius.md, padding:12, fontSize:16, color:theme.textPrimary, fontWeight:'700', marginBottom: Spacing.md }}
            value={name} onChangeText={setName} placeholder="Ej: Día de pecho, Pata..." placeholderTextColor={theme.textMuted} />

          <Text style={{ color:theme.textMuted, fontSize:11, fontWeight:'700', letterSpacing:0.8, marginBottom:6 }}>FECHA *</Text>
          <TextInput style={{ backgroundColor:theme.bgElevated, borderWidth:1, borderColor:theme.border, borderRadius:Radius.md, padding:12, fontSize:15, color:theme.textPrimary, marginBottom: Spacing.md }}
            value={date} onChangeText={setDate} placeholder="AAAA-MM-DD" placeholderTextColor={theme.textMuted} keyboardType="numbers-and-punctuation" />

          <Text style={{ color:theme.textMuted, fontSize:11, fontWeight:'700', letterSpacing:0.8, marginBottom:6 }}>DURACIÓN *</Text>
          <View style={{ flexDirection:'row', gap:10 }}>
            <View style={{ flex:1 }}>
              <TextInput style={{ backgroundColor:theme.bgElevated, borderWidth:1, borderColor:theme.border, borderRadius:Radius.md, padding:12, fontSize:16, color:theme.textPrimary, fontWeight:'700', textAlign:'center' }}
                value={durationH} onChangeText={setDurationH} keyboardType="number-pad" />
              <Text style={{ color:theme.textMuted, fontSize:10, textAlign:'center', marginTop:4 }}>Horas</Text>
            </View>
            <View style={{ flex:1 }}>
              <TextInput style={{ backgroundColor:theme.bgElevated, borderWidth:1, borderColor:theme.border, borderRadius:Radius.md, padding:12, fontSize:16, color:theme.textPrimary, fontWeight:'700', textAlign:'center' }}
                value={durationM} onChangeText={setDurationM} keyboardType="number-pad" />
              <Text style={{ color:theme.textMuted, fontSize:10, textAlign:'center', marginTop:4 }}>Minutos</Text>
            </View>
          </View>
        </View>

        {/* Load from routine */}
        {routines.length > 0 && (
          <View style={{ marginBottom: Spacing.md }}>
            <SectionHeader title="Cargar desde rutina" subtitle="Opcional - rellena ejercicios automáticamente" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {routines.map(r => (
                <TouchableOpacity key={r.id} onPress={() => loadRoutine(r.id)}
                  style={{ marginRight:8, paddingHorizontal:14, paddingVertical:9, borderRadius:Radius.full, backgroundColor: selectedRoutine===r.id ? theme.primary : theme.bgCard, borderWidth:1, borderColor: selectedRoutine===r.id ? theme.primary : theme.border }}>
                  <Text style={{ color: selectedRoutine===r.id ? '#fff' : theme.textSecondary, fontSize:13, fontWeight:'600' }}>{r.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Exercises */}
        <SectionHeader title={`Ejercicios (${workoutExercises.length})`} action={{ label: '+ Añadir', onPress: () => setShowExPicker(true) }} />

        {workoutExercises.map((we, ei) => {
          const ex = exercises.find(e => e.id === we.exerciseId);
          return (
            <View key={we.id} style={{ backgroundColor:theme.bgCard, borderRadius:Radius.lg, marginBottom: Spacing.md, borderWidth:1, borderColor:theme.border, overflow:'hidden' }}>
              <LinearGradient colors={[theme.secondary+'44','transparent']} start={{x:0,y:0}} end={{x:1,y:0}} style={{height:3}} />
              <View style={{ padding: Spacing.md }}>
                <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <View style={{ flex:1 }}>
                    <Text style={{ color:theme.textPrimary, fontSize:15, fontWeight:'800' }}>{ex?.name || we.exerciseId}</Text>
                    <Text style={{ color:theme.textMuted, fontSize:11 }}>{MUSCLE_LABELS[ex?.primaryMuscle||''] || ex?.primaryMuscle} · {ex?.equipment}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeEx(ei)} style={{ paddingHorizontal:10, paddingVertical:5, borderRadius:Radius.full, backgroundColor:theme.dangerSubtle, borderWidth:1, borderColor:theme.danger+'40' }}>
                    <Text style={{ color:theme.danger, fontSize:12, fontWeight:'700' }}>✕ Quitar</Text>
                  </TouchableOpacity>
                </View>

                {/* Header row */}
                <View style={{ flexDirection:'row', paddingBottom:6, borderBottomWidth:1, borderBottomColor:theme.border, marginBottom:4 }}>
                  <Text style={{ color:theme.textMuted, fontSize:10, fontWeight:'700', width:32 }}>SET</Text>
                  <Text style={{ color:theme.textMuted, fontSize:10, fontWeight:'700', flex:1, textAlign:'center' }}>KG</Text>
                  <Text style={{ color:theme.textMuted, fontSize:10, fontWeight:'700', flex:1, textAlign:'center' }}>REPS</Text>
                  <View style={{ width:28 }} />
                </View>

                {we.sets.map((s, si) => {
                  const isEditW = editing?.ei===ei && editing?.si===si && editing?.field==='weight';
                  const isEditR = editing?.ei===ei && editing?.si===si && editing?.field==='reps';
                  return (
                    <View key={s.id} style={{ flexDirection:'row', alignItems:'center', paddingVertical:6, borderBottomWidth:1, borderBottomColor:theme.border+'80' }}>
                      <View style={{ width:32, height:24, borderRadius:12, backgroundColor:s.weight>0&&s.reps>0?theme.success:theme.bgElevated, alignItems:'center', justifyContent:'center' }}>
                        <Text style={{ color:s.weight>0&&s.reps>0?'#fff':theme.textMuted, fontSize:12, fontWeight:'700' }}>{si+1}</Text>
                      </View>
                      {isEditW ? (
                        <TextInput style={{ flex:1, textAlign:'center', backgroundColor:theme.bgElevated, borderRadius:Radius.sm, borderWidth:1, borderColor:theme.primary, paddingVertical:5, fontSize:16, color:theme.textPrimary, fontWeight:'700', marginLeft:4 }}
                          value={editing.val} onChangeText={v=>setEditing(e=>e?{...e,val:v}:null)} keyboardType="decimal-pad" autoFocus onBlur={commitEdit} onSubmitEditing={commitEdit} />
                      ) : (
                        <TouchableOpacity onPress={() => setEditing({ei,si,field:'weight',val:s.weight>0?String(s.weight):''})}
                          style={{ flex:1, marginLeft:4, paddingVertical:7, borderRadius:Radius.sm, backgroundColor:theme.bgElevated, borderWidth:1, borderColor:theme.border, alignItems:'center' }}>
                          <Text style={{ color:s.weight>0?theme.textPrimary:theme.textMuted, fontSize:15, fontWeight:'700' }}>{s.weight>0?s.weight:'—'}</Text>
                        </TouchableOpacity>
                      )}
                      {isEditR ? (
                        <TextInput style={{ flex:1, textAlign:'center', backgroundColor:theme.bgElevated, borderRadius:Radius.sm, borderWidth:1, borderColor:theme.secondary, paddingVertical:5, fontSize:16, color:theme.textPrimary, fontWeight:'700', marginLeft:6 }}
                          value={editing.val} onChangeText={v=>setEditing(e=>e?{...e,val:v}:null)} keyboardType="number-pad" autoFocus onBlur={commitEdit} onSubmitEditing={commitEdit} />
                      ) : (
                        <TouchableOpacity onPress={() => setEditing({ei,si,field:'reps',val:s.reps>0?String(s.reps):''})}
                          style={{ flex:1, marginLeft:6, paddingVertical:7, borderRadius:Radius.sm, backgroundColor:theme.bgElevated, borderWidth:1, borderColor:theme.border, alignItems:'center' }}>
                          <Text style={{ color:s.reps>0?theme.textPrimary:theme.textMuted, fontSize:15, fontWeight:'700' }}>{s.reps>0?s.reps:'—'}</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity onPress={() => removeSet(ei,si)} style={{ width:28, alignItems:'center' }}>
                        <Text style={{ color:theme.danger, fontSize:16 }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
                <TouchableOpacity onPress={() => addSet(ei)}
                  style={{ marginTop:8, paddingVertical:8, borderRadius:Radius.sm, alignItems:'center', borderWidth:1, borderColor:theme.secondary+'60', borderStyle:'dashed' }}>
                  <Text style={{ color:theme.secondary, fontSize:13, fontWeight:'600' }}>+ Serie</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {workoutExercises.length === 0 && (
          <TouchableOpacity onPress={() => setShowExPicker(true)}
            style={{ borderWidth:2, borderColor:theme.border, borderStyle:'dashed', borderRadius:Radius.lg, padding:24, alignItems:'center', marginBottom: Spacing.md }}>
            <Text style={{ color:theme.textMuted, fontSize:15, fontWeight:'600' }}>+ Añadir ejercicio</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Save button */}
      <View style={{ position:'absolute', bottom:0, left:0, right:0, padding:Spacing.md, backgroundColor:theme.bg, borderTopWidth:1, borderTopColor:theme.border, flexDirection:'row', gap:10 }}>
        <Button title="Cancelar" onPress={() => router.back()} variant="ghost" style={{ flex:1 }} />
        <Button title="💾 Guardar entreno" onPress={save} style={{ flex:2 }} />
      </View>

      {/* Exercise picker modal */}
      <Modal visible={showExPicker} animationType="slide" onRequestClose={() => setShowExPicker(false)}>
        <View style={{ flex:1, backgroundColor:theme.bg }}>
          <View style={{ paddingTop:56, paddingHorizontal:Spacing.md, paddingBottom:Spacing.md, borderBottomWidth:1, borderBottomColor:theme.border }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <Text style={{ color:theme.textPrimary, fontSize:20, fontWeight:'900' }}>Seleccionar ejercicio</Text>
              <TouchableOpacity onPress={() => setShowExPicker(false)}><Text style={{ color:theme.textSecondary, fontSize:26 }}>✕</Text></TouchableOpacity>
            </View>
            <TextInput style={{ backgroundColor:theme.bgElevated, borderWidth:1, borderColor:theme.border, borderRadius:Radius.md, padding:12, fontSize:14, color:theme.textPrimary, marginBottom:10 }}
              value={exSearch} onChangeText={setExSearch} placeholder="Buscar..." placeholderTextColor={theme.textMuted} autoFocus />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {uniqueMuscles.map(m => (
                <TouchableOpacity key={m} onPress={() => setExMuscleFilter(m)}
                  style={{ paddingHorizontal:12, paddingVertical:6, borderRadius:Radius.full, marginRight:6, backgroundColor:exMuscleFilter===m?theme.primary:theme.bgElevated, borderWidth:1, borderColor:exMuscleFilter===m?theme.primary:theme.border }}>
                  <Text style={{ color:exMuscleFilter===m?'#fff':theme.textSecondary, fontSize:12, fontWeight:'600' }}>
                    {m==='all'?'Todos':MUSCLE_LABELS[m]||m}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <ScrollView contentContainerStyle={{ padding:Spacing.md, paddingBottom:40 }} showsVerticalScrollIndicator={false}>
            {filteredEx.map(ex => (
              <TouchableOpacity key={ex.id} onPress={() => addEx(ex.id)}
                style={{ flexDirection:'row', alignItems:'center', paddingVertical:14, borderBottomWidth:1, borderBottomColor:theme.border }}>
                <View style={{ flex:1 }}>
                  <Text style={{ color:theme.textPrimary, fontSize:14, fontWeight:'600' }}>{ex.name}</Text>
                  <Text style={{ color:theme.textMuted, fontSize:11, marginTop:2 }}>{MUSCLE_LABELS[ex.primaryMuscle]||ex.primaryMuscle} · {ex.equipment}</Text>
                </View>
                <View style={{ width:28, height:28, borderRadius:14, backgroundColor:theme.primary, alignItems:'center', justifyContent:'center' }}>
                  <Text style={{ color:'#fff', fontSize:18, lineHeight:22 }}>+</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
