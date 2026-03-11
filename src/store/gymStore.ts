import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Workout, Routine, Exercise, Goal, PersonalRecord, WorkoutExercise, WorkoutSet, GymStats, BodyWeightEntry, BodyWeightGoal } from '../types';
import { EXERCISE_DB } from '../constants/exercises';
import { ACHIEVEMENTS } from '../constants/achievements';
import { calculate1RM, calculateStreak, calculateXPForWorkout, generateId, getAthleteProgress, getLevelProgress } from '../utils/calculations';

const DEFAULT_STATS: GymStats = {
  totalWorkouts: 0, currentStreak: 0, longestStreak: 0,
  totalVolume: 0, totalDuration: 0, lastWorkoutDate: undefined,
  athleteTier: 1, gymLevel: 1, xp: 0,
};

interface StoreActions {
  addWorkout: (w: Workout) => void;
  deleteWorkout: (id: string) => void;
  getWorkoutById: (id: string) => Workout | undefined;
  startWorkout: (name: string, routineId?: string) => void;
  updateActiveWorkoutName: (name: string) => void;
  addExerciseToActive: (ex: WorkoutExercise) => void;
  removeExerciseFromActive: (exIdx: number) => void;
  updateExerciseNotes: (exIdx: number, notes: string) => void;
  addSetToActiveExercise: (exIdx: number, set: WorkoutSet) => void;
  updateSetInActiveExercise: (exIdx: number, setIdx: number, u: Partial<WorkoutSet>) => void;
  removeSetFromActiveExercise: (exIdx: number, setIdx: number) => void;
  finishWorkout: () => Workout | null;
  cancelWorkout: () => void;
  addRoutine: (r: Routine) => void;
  updateRoutine: (id: string, u: Partial<Routine>) => void;
  deleteRoutine: (id: string) => void;
  addExercise: (e: Exercise) => void;
  updateExercise: (id: string, u: Partial<Exercise>) => void;
  deleteCustomExercise: (id: string) => void;
  addGoal: (g: Goal) => void;
  updateGoal: (id: string, u: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  setManualPR: (exerciseId: string, weight: number, reps: number, date?: string) => void;
  checkAndUpdatePR: (exerciseId: string, weight: number, reps: number) => void;
  addBodyWeightEntry: (e: BodyWeightEntry) => void;
  updateBodyWeightEntry: (id: string, u: Partial<BodyWeightEntry>) => void;
  deleteBodyWeightEntry: (id: string) => void;
  setBodyWeightGoal: (g: BodyWeightGoal | null) => void;
  clearAllData: () => void;
  getExerciseHistory: (exerciseId: string) => { date: string; weight: number; reps: number; estimated1RM: number }[];
  getMuscleFrequency: (days?: number) => Record<string, number>;
  getLastSetsForExercise: (exerciseId: string) => WorkoutSet[] | null;
  getMuscleStats: (muscle: string) => { totalSessions: number; thisWeek: number; bestWeight: number; bestExercise: string };
}

type FullStore = AppState & StoreActions;

const recalc = (workouts: Workout[], prev: GymStats, addXP: number): GymStats => {
  const streak = calculateStreak(workouts.map(w => w.date));
  const totalVolume = workouts.reduce((a, w) => a + w.exercises.reduce((b, e) => b + e.sets.reduce((c, s) => c + s.weight * s.reps, 0), 0), 0);
  const xp = prev.xp + addXP;
  const lvl = getAthleteProgress(workouts.length, xp);
  return {
    totalWorkouts: workouts.length, currentStreak: streak,
    longestStreak: Math.max(prev.longestStreak, streak),
    totalVolume, totalDuration: workouts.reduce((a, w) => a + w.duration, 0),
    lastWorkoutDate: workouts.length > 0 ? workouts[workouts.length - 1].date : undefined,
    athleteTier: lvl,
    gymLevel: lvl, xp,
  };
};

export const useGymStore = create<FullStore>()(
  persist(
    (set, get) => ({
      workouts: [], routines: [], exercises: [...EXERCISE_DB],
      goals: [], prs: [], stats: DEFAULT_STATS,
      achievements: ACHIEVEMENTS.map(a => ({ ...a })), activeWorkout: null,
      bodyWeightEntries: [], bodyWeightGoal: null,

      addWorkout: (workout) => set(s => {
        const workouts = [...s.workouts, workout];
        return { workouts, stats: recalc(workouts, s.stats, calculateXPForWorkout(workout.duration, workout.exercises.length, false)) };
      }),
      deleteWorkout: (id) => set(s => {
        const workouts = s.workouts.filter(w => w.id !== id);
        return { workouts, stats: recalc(workouts, { ...s.stats, xp: s.stats.xp }, 0) };
      }),
      getWorkoutById: (id) => get().workouts.find(w => w.id === id),

      startWorkout: (name, routineId) => {
        const s = get();
        let exercises: WorkoutExercise[] = [];
        if (routineId) {
          const routine = s.routines.find(r => r.id === routineId);
          if (routine) {
            exercises = routine.exercises.map(re => {
              const lastSets = s.getLastSetsForExercise(re.exerciseId);
              const defReps = typeof re.targetReps === 'string' ? parseInt(re.targetReps) || 0 : re.targetReps || 0;
              return {
                id: generateId(), exerciseId: re.exerciseId,
                sets: Array.from({ length: re.targetSets }, (_, i) => ({
                  id: generateId(), exerciseId: re.exerciseId,
                  weight: lastSets?.[i]?.weight ?? 0,
                  reps: lastSets?.[i]?.reps ?? defReps,
                  completedAt: new Date().toISOString(),
                })),
              };
            });
          }
        }
        set({ activeWorkout: { name, routineId, startedAt: new Date().toISOString(), exercises, restTimerActive: false, restTimeRemaining: 0, restTimerTotal: 0 } });
      },

      updateActiveWorkoutName: (name) => set(s => s.activeWorkout ? ({ activeWorkout: { ...s.activeWorkout, name } }) : s),

      addExerciseToActive: (ex) => set(s => !s.activeWorkout ? s : ({
        activeWorkout: { ...s.activeWorkout, exercises: [...s.activeWorkout.exercises, ex] }
      })),
      removeExerciseFromActive: (exIdx) => set(s => {
        if (!s.activeWorkout) return s;
        const exercises = s.activeWorkout.exercises.filter((_, i) => i !== exIdx);
        return { activeWorkout: { ...s.activeWorkout, exercises } };
      }),
      updateExerciseNotes: (exIdx, notes) => set(s => {
        if (!s.activeWorkout) return s;
        const exercises = s.activeWorkout.exercises.map((e, i) => i === exIdx ? { ...e, notes } : e);
        return { activeWorkout: { ...s.activeWorkout, exercises } };
      }),
      addSetToActiveExercise: (i, ns) => set(s => {
        if (!s.activeWorkout) return s;
        const exercises = s.activeWorkout.exercises.map((e, idx) => idx === i ? { ...e, sets: [...e.sets, ns] } : e);
        return { activeWorkout: { ...s.activeWorkout, exercises } };
      }),
      updateSetInActiveExercise: (ei, si, u) => set(s => {
        if (!s.activeWorkout) return s;
        const exercises = s.activeWorkout.exercises.map((e, i) => i !== ei ? e : { ...e, sets: e.sets.map((ss, j) => j === si ? { ...ss, ...u } : ss) });
        return { activeWorkout: { ...s.activeWorkout, exercises } };
      }),
      removeSetFromActiveExercise: (ei, si) => set(s => {
        if (!s.activeWorkout) return s;
        const exercises = s.activeWorkout.exercises.map((e, i) => i !== ei ? e : { ...e, sets: e.sets.filter((_, j) => j !== si) });
        return { activeWorkout: { ...s.activeWorkout, exercises } };
      }),
      finishWorkout: () => {
        const s = get();
        if (!s.activeWorkout) return null;
        const { activeWorkout: aw } = s;
        const duration = Math.round((Date.now() - new Date(aw.startedAt).getTime()) / 60000);
        const workout: Workout = { id: generateId(), name: aw.name, date: new Date().toISOString(), duration, exercises: aw.exercises };
        s.addWorkout(workout);
        aw.exercises.forEach(we => we.sets.forEach(ss => { if (ss.weight > 0 && ss.reps > 0) s.checkAndUpdatePR(we.exerciseId, ss.weight, ss.reps); }));
        set({ activeWorkout: null });
        return workout;
      },
      cancelWorkout: () => set({ activeWorkout: null }),

      addRoutine: (r) => set(s => ({ routines: [...s.routines, r] })),
      updateRoutine: (id, u) => set(s => ({ routines: s.routines.map(r => r.id === id ? { ...r, ...u } : r) })),
      deleteRoutine: (id) => set(s => ({ routines: s.routines.filter(r => r.id !== id) })),

      addExercise: (e) => set(s => ({ exercises: [...s.exercises, e] })),
      updateExercise: (id, u) => set(s => ({ exercises: s.exercises.map(e => e.id === id ? { ...e, ...u } : e) })),
      deleteCustomExercise: (id) => set(s => ({ exercises: s.exercises.filter(e => e.id !== id || !e.isCustom) })),

      addGoal: (g) => set(s => ({ goals: [...s.goals, g] })),
      updateGoal: (id, u) => set(s => ({ goals: s.goals.map(g => g.id === id ? { ...g, ...u } : g) })),
      deleteGoal: (id) => set(s => ({ goals: s.goals.filter(g => g.id !== id) })),

      setManualPR: (exerciseId, weight, reps, date) => {
        const pr: PersonalRecord = { exerciseId, weight, reps, estimated1RM: calculate1RM(weight, reps), date: date || new Date().toISOString() };
        set(s => ({ prs: [...s.prs.filter(p => p.exerciseId !== exerciseId), pr] }));
      },
      checkAndUpdatePR: (exerciseId, weight, reps) => {
        const est = calculate1RM(weight, reps);
        const ex = get().prs.find(p => p.exerciseId === exerciseId);
        if (!ex || est > ex.estimated1RM)
          set(s => ({ prs: [...s.prs.filter(p => p.exerciseId !== exerciseId), { exerciseId, weight, reps, estimated1RM: est, date: new Date().toISOString() }] }));
      },

      addBodyWeightEntry: (e) => set(s => ({ bodyWeightEntries: [...s.bodyWeightEntries, e].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) })),
      updateBodyWeightEntry: (id, u) => set(s => ({ bodyWeightEntries: s.bodyWeightEntries.map(e => e.id === id ? { ...e, ...u } : e) })),
      deleteBodyWeightEntry: (id) => set(s => ({ bodyWeightEntries: s.bodyWeightEntries.filter(e => e.id !== id) })),
      setBodyWeightGoal: (g) => set({ bodyWeightGoal: g }),

      clearAllData: () => set({
        workouts: [], prs: [], goals: [], bodyWeightEntries: [], bodyWeightGoal: null,
        stats: DEFAULT_STATS, achievements: ACHIEVEMENTS.map(a => ({ ...a })), activeWorkout: null,
        // Factory reset: remove custom exercises, restore defaults
        exercises: EXERCISE_DB,
        routines: [],
      }),

      getExerciseHistory: (exerciseId) => get().workouts
        .filter(w => w.exercises.some(e => e.exerciseId === exerciseId))
        .map(w => { const we = w.exercises.find(e => e.exerciseId === exerciseId)!; if (!we?.sets.length) return null; const top = we.sets.reduce((b, s) => calculate1RM(s.weight, s.reps) > calculate1RM(b.weight, b.reps) ? s : b, we.sets[0]); return { date: w.date, weight: top.weight, reps: top.reps, estimated1RM: calculate1RM(top.weight, top.reps) }; })
        .filter(Boolean).sort((a, b) => new Date(a!.date).getTime() - new Date(b!.date).getTime()) as any,

      getMuscleFrequency: (days = 30) => {
        const { workouts, exercises } = get();
        const freq: Record<string, number> = {};
        const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
        workouts.filter(w => new Date(w.date) > cutoff).forEach(w => w.exercises.forEach(we => {
          const ex = exercises.find(e => e.id === we.exerciseId);
          if (ex) { freq[ex.primaryMuscle] = (freq[ex.primaryMuscle] || 0) + 1; ex.secondaryMuscles.forEach(m => { freq[m] = (freq[m] || 0) + 0.5; }); }
        }));
        return freq;
      },
      getLastSetsForExercise: (exerciseId) => {
        const sorted = [...get().workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        for (const w of sorted) { const f = w.exercises.find(e => e.exerciseId === exerciseId); if (f) return f.sets; }
        return null;
      },
      getMuscleStats: (muscle) => {
        const { workouts, exercises } = get();
        const relatedExIds = exercises.filter(e => e.primaryMuscle === muscle || e.secondaryMuscles.includes(muscle as any)).map(e => e.id);
        const weekCutoff = new Date(); weekCutoff.setDate(weekCutoff.getDate() - 7);
        let totalSessions = 0; let thisWeek = 0; let bestWeight = 0; let bestExercise = '';
        workouts.forEach(w => {
          let worked = false;
          w.exercises.forEach(we => {
            if (!relatedExIds.includes(we.exerciseId)) return;
            worked = true;
            we.sets.forEach(s => {
              if (s.weight > bestWeight) { bestWeight = s.weight; const ex = exercises.find(e => e.id === we.exerciseId); bestExercise = ex?.name || ''; }
            });
          });
          if (worked) { totalSessions++; if (new Date(w.date) > weekCutoff) thisWeek++; }
        });
        return { totalSessions, thisWeek, bestWeight, bestExercise };
      },
    }),
    { name: 'gym-store-v4', storage: createJSONStorage(() => AsyncStorage) }
  )
);
