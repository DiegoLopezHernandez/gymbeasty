import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, View, Text, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useGymStore } from '../../src/store/gymStore';
import { Button, Badge, useTheme } from '../../src/components/ui';
import { Spacing, Radius } from '../../src/constants/theme';
import { generateId } from '../../src/utils/calculations';

const MUSCLE_LABELS: Record<string, string> = {
  chest:'Pecho', back:'Espalda', lats:'Dorsales', shoulders:'Hombros', biceps:'Bíceps',
  triceps:'Tríceps', quads:'Cuádriceps', hamstrings:'Femoral', glutes:'Glúteos',
  abs:'Abdomen', calves:'Gemelos', traps:'Trapecios', forearms:'Antebrazos',
};

function pad(n: number) { return String(n).padStart(2,'0'); }
function formatTime(secs: number) { return `${pad(Math.floor(secs/60))}:${pad(secs%60)}`; }

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const theme = useTheme();
  const {
    activeWorkout, exercises,
    updateActiveWorkoutName, updateSetInActiveExercise, addSetToActiveExercise,
    removeSetFromActiveExercise, addExerciseToActive, removeExerciseFromActive,
    updateExerciseNotes, finishWorkout, cancelWorkout,
  } = useGymStore();

  const [elapsed, setElapsed] = useState(0);
  const [rest, setRest] = useState(0);
  const [restActive, setRestActive] = useState(false);
  const [showExPicker, setShowExPicker] = useState(false);
  const [exSearch, setExSearch] = useState('');
  const [exMuscleFilter, setExMuscleFilter] = useState('all');
  const [editing, setEditing] = useState<{ei:number;si:number;field:'weight'|'reps';val:string}|null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState('');
  const [notesTarget, setNotesTarget] = useState<number|null>(null);
  const [notesVal, setNotesVal] = useState('');
  const intervalRef = useRef<any>(null);
  const restRef = useRef<any>(null);

  useEffect(() => {
    if (!activeWorkout) { router.replace('/'); return; }
    const start = new Date(activeWorkout.startedAt).getTime();
    intervalRef.current = setInterval(() => setElapsed(Math.floor((Date.now()-start)/1000)), 1000);
    return () => clearInterval(intervalRef.current);
  }, [activeWorkout]);

  useEffect(() => {
    if (restActive) {
      restRef.current = setInterval(() => setRest(r => { if (r<=1) { setRestActive(false); clearInterval(restRef.current); return 0; } return r-1; }), 1000);
    } else clearInterval(restRef.current);
    return () => clearInterval(restRef.current);
  }, [restActive]);

  const startRest = (secs: number) => { setRest(secs); setRestActive(true); };

  const finish = () => Alert.alert('Terminar entreno', '¿Dar por terminado?', [
    { text: 'Cancelar', style: 'cancel' },
    { text: '✅ Terminar', onPress: () => { finishWorkout(); router.replace('/'); } },
  ]);

  const cancel = () => Alert.alert('Cancelar entreno', '¿Cancelar? Se perderán los datos.', [
    { text: 'No', style: 'cancel' },
    { text: 'Sí, cancelar', style: 'destructive', onPress: () => { cancelWorkout(); router.replace('/'); } },
  ]);

  const commitEdit = () => {
    if (!editing) return;
    const val = parseFloat(editing.val);
    if (!isNaN(val)) updateSetInActiveExercise(editing.ei, editing.si, { [editing.field]: val });
    setEditing(null);
  };

  const saveName = () => {
    if (nameVal.trim()) updateActiveWorkoutName(nameVal.trim());
    setEditingName(false);
  };

  const openNotes = (ei: number) => {
    setNotesTarget(ei);
    setNotesVal(activeWorkout?.exercises[ei]?.notes || '');
  };

  const saveNotes = () => {
    if (notesTarget !== null) updateExerciseNotes(notesTarget, notesVal);
    setNotesTarget(null);
  };

  const addEx = (exId: string) => {
    addExerciseToActive({ id: generateId(), exerciseId: exId, sets: [{ id: generateId(), exerciseId: exId, weight: 0, reps: 0, completedAt: new Date().toISOString() }] });
    setShowExPicker(false);
  };

  if (!activeWorkout) return null;

  const uniqueMuscles = ['all', ...Array.from(new Set(exercises.map(e => e.primaryMuscle)))];
  const filteredEx = exercises.filter(e => {
    const matchS = !exSearch || e.name.toLowerCase().includes(exSearch.toLowerCase());
    const matchM = exMuscleFilter==='all' || e.primaryMuscle===exMuscleFilter;
    return matchS && matchM;
  });

  return (
    <View style={{ flex:1, backgroundColor:theme.bg }}>
      {/* Header */}
      <LinearGradient colors={theme.mode==='dark'?[theme.primary+'DD','#181B20']:[theme.primary+'AA','#ECEAE5']}
        style={{ paddingTop:54, paddingHorizontal:Spacing.md, paddingBottom:Spacing.md }}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
          <View style={{ flex:1 }}>
            <Text style={{ color:'rgba(255,255,255,0.75)', fontSize:11, fontWeight:'700', letterSpacing:1 }}>🔴 EN CURSO</Text>
            {editingName ? (
              <TextInput style={{ color:'#fff', fontSize:20, fontWeight:'900', borderBottomWidth:1, borderBottomColor:'rgba(255,255,255,0.5)', paddingBottom:2 }}
                value={nameVal} onChangeText={setNameVal} autoFocus onBlur={saveName} onSubmitEditing={saveName} />
            ) : (
              <TouchableOpacity onPress={() => { setNameVal(activeWorkout.name); setEditingName(true); }} style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
                <Text style={{ color:'#fff', fontSize:20, fontWeight:'900' }} numberOfLines={1}>{activeWorkout.name}</Text>
                <Text style={{ color:'rgba(255,255,255,0.5)', fontSize:12 }}>✏️</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={{ alignItems:'flex-end' }}>
            <Text style={{ color:'rgba(255,255,255,0.7)', fontSize:11 }}>Tiempo</Text>
            <Text style={{ color:'#fff', fontSize:22, fontWeight:'900', fontVariant:['tabular-nums'] }}>{formatTime(elapsed)}</Text>
          </View>
        </View>
        {restActive && (
          <View style={{ marginTop:10, backgroundColor:'rgba(0,0,0,0.3)', borderRadius:Radius.md, padding:10, flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
            <Text style={{ color:'#fff', fontSize:13, fontWeight:'700' }}>⏱ Descanso: <Text style={{ color:rest<=10?'#FF6B35':'#fff', fontSize:20, fontWeight:'900' }}>{formatTime(rest)}</Text></Text>
            <TouchableOpacity onPress={() => setRestActive(false)} style={{ paddingHorizontal:12, paddingVertical:6, backgroundColor:'rgba(255,255,255,0.2)', borderRadius:Radius.full }}>
              <Text style={{ color:'#fff', fontSize:12, fontWeight:'700' }}>Saltar</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding:Spacing.md, paddingBottom:140 }} showsVerticalScrollIndicator={false}>
        {activeWorkout.exercises.map((we, ei) => {
          const ex = exercises.find(e => e.id === we.exerciseId);
          const lastSets = useGymStore.getState().getLastSetsForExercise(we.exerciseId);
          return (
            <View key={we.id} style={{ backgroundColor:theme.bgCard, borderRadius:Radius.lg, marginBottom:Spacing.md, borderWidth:1, borderColor:theme.border, overflow:'hidden' }}>
              <LinearGradient colors={[theme.primary+'44','transparent']} start={{x:0,y:0}} end={{x:1,y:0}} style={{height:3}} />
              <View style={{ padding:Spacing.md }}>
                {/* Exercise header */}
                <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <View style={{ flex:1 }}>
                    <Text style={{ color:theme.textPrimary, fontSize:16, fontWeight:'800' }}>{ex?.name || we.exerciseId}</Text>
                    <Text style={{ color:theme.textMuted, fontSize:11 }}>{MUSCLE_LABELS[ex?.primaryMuscle||'']||ex?.primaryMuscle} · {ex?.equipment}</Text>
                  </View>
                  <View style={{ flexDirection:'row', gap:6 }}>
                    <TouchableOpacity onPress={() => openNotes(ei)} style={{ paddingHorizontal:10, paddingVertical:5, borderRadius:Radius.full, backgroundColor:theme.bgElevated, borderWidth:1, borderColor:theme.border }}>
                      <Text style={{ color:we.notes?theme.secondary:theme.textMuted, fontSize:13 }}>📝</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => Alert.alert('Eliminar ejercicio', `¿Quitar "${ex?.name}" del entreno?`, [
                      { text: 'Cancelar', style:'cancel' },
                      { text: 'Quitar', style:'destructive', onPress: () => removeExerciseFromActive(ei) },
                    ])} style={{ paddingHorizontal:10, paddingVertical:5, borderRadius:Radius.full, backgroundColor:theme.dangerSubtle, borderWidth:1, borderColor:theme.danger+'40' }}>
                      <Text style={{ color:theme.danger, fontSize:12, fontWeight:'700' }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {we.notes && (
                  <View style={{ backgroundColor:theme.bgElevated, borderRadius:Radius.sm, padding:8, marginBottom:10, borderLeftWidth:3, borderLeftColor:theme.secondary }}>
                    <Text style={{ color:theme.textSecondary, fontSize:12 }}>{we.notes}</Text>
                  </View>
                )}

                {/* Sets header */}
                <View style={{ flexDirection:'row', paddingBottom:6, borderBottomWidth:1, borderBottomColor:theme.border, marginBottom:4 }}>
                  <Text style={{ color:theme.textMuted, fontSize:10, fontWeight:'700', width:32 }}>SET</Text>
                  <Text style={{ color:theme.textMuted, fontSize:10, fontWeight:'700', flex:1, textAlign:'center' }}>ANTERIOR</Text>
                  <Text style={{ color:theme.textMuted, fontSize:10, fontWeight:'700', width:80, textAlign:'center' }}>KG</Text>
                  <Text style={{ color:theme.textMuted, fontSize:10, fontWeight:'700', width:60, textAlign:'center' }}>REPS</Text>
                  <View style={{ width:28 }} />
                </View>

                {we.sets.map((s, si) => {
                  const prev = lastSets?.[si];
                  const isEditW = editing?.ei===ei && editing?.si===si && editing?.field==='weight';
                  const isEditR = editing?.ei===ei && editing?.si===si && editing?.field==='reps';
                  return (
                    <View key={s.id} style={{ flexDirection:'row', alignItems:'center', paddingVertical:7, borderBottomWidth:1, borderBottomColor:theme.border+'80' }}>
                      <View style={{ width:32, height:24, borderRadius:12, backgroundColor:s.weight>0&&s.reps>0?theme.success:theme.bgElevated, alignItems:'center', justifyContent:'center' }}>
                        <Text style={{ color:s.weight>0&&s.reps>0?'#fff':theme.textMuted, fontSize:12, fontWeight:'700' }}>{si+1}</Text>
                      </View>
                      <Text style={{ flex:1, textAlign:'center', color:theme.textMuted, fontSize:11 }}>{prev?`${prev.weight}×${prev.reps}`:'—'}</Text>
                      {isEditW ? (
                        <TextInput style={{ width:80, textAlign:'center', backgroundColor:theme.bgElevated, borderRadius:Radius.sm, borderWidth:1, borderColor:theme.primary, paddingVertical:5, fontSize:16, color:theme.textPrimary, fontWeight:'700' }}
                          value={editing.val} onChangeText={v=>setEditing(e=>e?{...e,val:v}:null)} keyboardType="decimal-pad" autoFocus onBlur={commitEdit} onSubmitEditing={commitEdit} />
                      ) : (
                        <TouchableOpacity onPress={() => setEditing({ei,si,field:'weight',val:s.weight>0?String(s.weight):''})}
                          style={{ width:80, paddingVertical:7, borderRadius:Radius.sm, backgroundColor:theme.bgElevated, borderWidth:1, borderColor:theme.border, alignItems:'center' }}>
                          <Text style={{ color:s.weight>0?theme.textPrimary:theme.textMuted, fontSize:15, fontWeight:'700' }}>{s.weight>0?s.weight:'—'}</Text>
                        </TouchableOpacity>
                      )}
                      {isEditR ? (
                        <TextInput style={{ width:60, textAlign:'center', backgroundColor:theme.bgElevated, borderRadius:Radius.sm, borderWidth:1, borderColor:theme.secondary, paddingVertical:5, fontSize:16, color:theme.textPrimary, fontWeight:'700', marginLeft:6 }}
                          value={editing.val} onChangeText={v=>setEditing(e=>e?{...e,val:v}:null)} keyboardType="number-pad" autoFocus onBlur={commitEdit} onSubmitEditing={commitEdit} />
                      ) : (
                        <TouchableOpacity onPress={() => setEditing({ei,si,field:'reps',val:s.reps>0?String(s.reps):''})}
                          style={{ width:60, paddingVertical:7, borderRadius:Radius.sm, backgroundColor:theme.bgElevated, borderWidth:1, borderColor:theme.border, alignItems:'center', marginLeft:6 }}>
                          <Text style={{ color:s.reps>0?theme.textPrimary:theme.textMuted, fontSize:15, fontWeight:'700' }}>{s.reps>0?s.reps:'—'}</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity onPress={() => removeSetFromActiveExercise(ei,si)} style={{ width:28, alignItems:'center' }}>
                        <Text style={{ color:theme.danger, fontSize:16 }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}

                {/* Add set + rest */}
                <View style={{ flexDirection:'row', gap:8, marginTop:10 }}>
                  <TouchableOpacity onPress={() => addSetToActiveExercise(ei, { id:generateId(), exerciseId:we.exerciseId, weight:we.sets[we.sets.length-1]?.weight||0, reps:we.sets[we.sets.length-1]?.reps||0, completedAt:new Date().toISOString() })}
                    style={{ flex:1, paddingVertical:8, borderRadius:Radius.sm, alignItems:'center', borderWidth:1, borderColor:theme.primary+'60', borderStyle:'dashed' }}>
                    <Text style={{ color:theme.primary, fontSize:13, fontWeight:'600' }}>+ Serie</Text>
                  </TouchableOpacity>
                  {[60,90,120].map(secs => (
                    <TouchableOpacity key={secs} onPress={() => startRest(secs)}
                      style={{ paddingVertical:8, paddingHorizontal:10, borderRadius:Radius.sm, borderWidth:1, borderColor:theme.border, backgroundColor:theme.bgElevated }}>
                      <Text style={{ color:theme.textMuted, fontSize:11, fontWeight:'600' }}>⏱{secs}s</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          );
        })}

        <TouchableOpacity onPress={() => setShowExPicker(true)}
          style={{ borderWidth:2, borderColor:theme.border, borderStyle:'dashed', borderRadius:Radius.lg, padding:16, alignItems:'center', marginBottom:Spacing.md }}>
          <Text style={{ color:theme.textMuted, fontSize:15, fontWeight:'600' }}>+ Añadir ejercicio</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom controls */}
      <View style={{ position:'absolute', bottom:0, left:0, right:0, padding:Spacing.md, backgroundColor:theme.bg, borderTopWidth:1, borderTopColor:theme.border, flexDirection:'row', gap:10 }}>
        <Button title="Cancelar" onPress={cancel} variant="ghost" style={{ flex:1 }} />
        <Button title="✅ Terminar" onPress={finish} style={{ flex:2 }} />
      </View>

      {/* Exercise picker */}
      <Modal visible={showExPicker} animationType="slide" onRequestClose={() => setShowExPicker(false)}>
        <View style={{ flex:1, backgroundColor:theme.bg }}>
          <View style={{ paddingTop:56, paddingHorizontal:Spacing.md, paddingBottom:Spacing.md, borderBottomWidth:1, borderBottomColor:theme.border }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <Text style={{ color:theme.textPrimary, fontSize:20, fontWeight:'900' }}>Añadir ejercicio</Text>
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

      {/* Notes modal */}
      <Modal visible={notesTarget !== null} animationType="slide" transparent onRequestClose={() => setNotesTarget(null)}>
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'flex-end' }}>
          <View style={{ backgroundColor:theme.bgCard, borderTopLeftRadius:24, borderTopRightRadius:24, padding:Spacing.lg, paddingBottom:40 }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:Spacing.md }}>
              <Text style={{ color:theme.textPrimary, fontSize:18, fontWeight:'900' }}>📝 Notas del ejercicio</Text>
              <TouchableOpacity onPress={() => setNotesTarget(null)}><Text style={{ color:theme.textSecondary, fontSize:26 }}>✕</Text></TouchableOpacity>
            </View>
            <TextInput style={{ backgroundColor:theme.bgElevated, borderWidth:1, borderColor:theme.border, borderRadius:Radius.md, padding:12, fontSize:14, color:theme.textPrimary, minHeight:80, textAlignVertical:'top', marginBottom:Spacing.md }}
              value={notesVal} onChangeText={setNotesVal} placeholder="Ej: Aumentar peso en la próxima sesión, grip doloroso..." placeholderTextColor={theme.textMuted} multiline autoFocus />
            <Button title="💾 Guardar notas" onPress={saveNotes} fullWidth />
          </View>
        </View>
      </Modal>
    </View>
  );
}
