import { Exercise } from '../types';

export const EXERCISE_DB: Exercise[] = [
  // ─── Chest ──────────────────────────────────────────────────────────────────
  { id: 'bench_press', name: 'Press Banca', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'shoulders'], category: 'compound', equipment: 'Barra' },
  { id: 'incline_bench', name: 'Press Inclinado', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'shoulders'], category: 'compound', equipment: 'Barra' },
  { id: 'decline_bench', name: 'Press Declinado', primaryMuscle: 'chest', secondaryMuscles: ['triceps'], category: 'compound', equipment: 'Barra' },
  { id: 'dumbbell_fly', name: 'Aperturas con Mancuerna', primaryMuscle: 'chest', secondaryMuscles: [], category: 'isolation', equipment: 'Mancuernas' },
  { id: 'cable_crossover', name: 'Cruce de Poleas', primaryMuscle: 'chest', secondaryMuscles: [], category: 'isolation', equipment: 'Poleas' },
  { id: 'pushup', name: 'Flexiones', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'shoulders'], category: 'compound', equipment: 'Peso corporal' },

  // ─── Back ───────────────────────────────────────────────────────────────────
  { id: 'deadlift', name: 'Peso Muerto', primaryMuscle: 'back', secondaryMuscles: ['glutes', 'hamstrings', 'traps', 'lats'], category: 'compound', equipment: 'Barra' },
  { id: 'pullup', name: 'Dominadas', primaryMuscle: 'lats', secondaryMuscles: ['biceps', 'back'], category: 'compound', equipment: 'Barra fija' },
  { id: 'barbell_row', name: 'Remo con Barra', primaryMuscle: 'back', secondaryMuscles: ['biceps', 'lats'], category: 'compound', equipment: 'Barra' },
  { id: 'lat_pulldown', name: 'Jalón al Pecho', primaryMuscle: 'lats', secondaryMuscles: ['biceps'], category: 'compound', equipment: 'Polea' },
  { id: 'seated_row', name: 'Remo Sentado', primaryMuscle: 'back', secondaryMuscles: ['biceps'], category: 'compound', equipment: 'Polea' },
  { id: 'face_pull', name: 'Face Pull', primaryMuscle: 'traps', secondaryMuscles: ['shoulders'], category: 'isolation', equipment: 'Polea' },

  // ─── Legs ───────────────────────────────────────────────────────────────────
  { id: 'squat', name: 'Sentadilla', primaryMuscle: 'quads', secondaryMuscles: ['glutes', 'hamstrings'], category: 'compound', equipment: 'Barra' },
  { id: 'leg_press', name: 'Prensa de Piernas', primaryMuscle: 'quads', secondaryMuscles: ['glutes', 'hamstrings'], category: 'compound', equipment: 'Máquina' },
  { id: 'romanian_deadlift', name: 'Peso Muerto Rumano', primaryMuscle: 'hamstrings', secondaryMuscles: ['glutes', 'back'], category: 'compound', equipment: 'Barra' },
  { id: 'leg_curl', name: 'Curl Femoral', primaryMuscle: 'hamstrings', secondaryMuscles: [], category: 'isolation', equipment: 'Máquina' },
  { id: 'leg_extension', name: 'Extensión de Cuádriceps', primaryMuscle: 'quads', secondaryMuscles: [], category: 'isolation', equipment: 'Máquina' },
  { id: 'lunges', name: 'Zancadas', primaryMuscle: 'quads', secondaryMuscles: ['glutes', 'hamstrings'], category: 'compound', equipment: 'Mancuernas' },
  { id: 'hip_thrust', name: 'Hip Thrust', primaryMuscle: 'glutes', secondaryMuscles: ['hamstrings'], category: 'compound', equipment: 'Barra' },
  { id: 'calf_raise', name: 'Elevación de Talones', primaryMuscle: 'calves', secondaryMuscles: [], category: 'isolation', equipment: 'Máquina' },

  // ─── Shoulders ──────────────────────────────────────────────────────────────
  { id: 'ohp', name: 'Press Militar', primaryMuscle: 'shoulders', secondaryMuscles: ['triceps', 'traps'], category: 'compound', equipment: 'Barra' },
  { id: 'dumbbell_ohp', name: 'Press Hombro Mancuerna', primaryMuscle: 'shoulders', secondaryMuscles: ['triceps'], category: 'compound', equipment: 'Mancuernas' },
  { id: 'lateral_raise', name: 'Elevaciones Laterales', primaryMuscle: 'shoulders', secondaryMuscles: [], category: 'isolation', equipment: 'Mancuernas' },
  { id: 'front_raise', name: 'Elevaciones Frontales', primaryMuscle: 'shoulders', secondaryMuscles: [], category: 'isolation', equipment: 'Mancuernas' },

  // ─── Arms ───────────────────────────────────────────────────────────────────
  { id: 'barbell_curl', name: 'Curl con Barra', primaryMuscle: 'biceps', secondaryMuscles: ['forearms'], category: 'isolation', equipment: 'Barra' },
  { id: 'dumbbell_curl', name: 'Curl con Mancuerna', primaryMuscle: 'biceps', secondaryMuscles: ['forearms'], category: 'isolation', equipment: 'Mancuernas' },
  { id: 'hammer_curl', name: 'Curl Martillo', primaryMuscle: 'biceps', secondaryMuscles: ['forearms'], category: 'isolation', equipment: 'Mancuernas' },
  { id: 'tricep_pushdown', name: 'Extensión Tríceps Polea', primaryMuscle: 'triceps', secondaryMuscles: [], category: 'isolation', equipment: 'Polea' },
  { id: 'skull_crusher', name: 'Skull Crusher', primaryMuscle: 'triceps', secondaryMuscles: [], category: 'isolation', equipment: 'Barra' },
  { id: 'close_grip_bench', name: 'Press Agarre Cerrado', primaryMuscle: 'triceps', secondaryMuscles: ['chest'], category: 'compound', equipment: 'Barra' },

  // ─── Core ───────────────────────────────────────────────────────────────────
  { id: 'crunch', name: 'Crunch Abdominal', primaryMuscle: 'abs', secondaryMuscles: [], category: 'isolation', equipment: 'Peso corporal' },
  { id: 'plank', name: 'Plancha', primaryMuscle: 'abs', secondaryMuscles: [], category: 'isolation', equipment: 'Peso corporal' },
  { id: 'leg_raise', name: 'Elevación de Piernas', primaryMuscle: 'abs', secondaryMuscles: [], category: 'isolation', equipment: 'Peso corporal' },
  { id: 'cable_crunch', name: 'Crunch en Polea', primaryMuscle: 'abs', secondaryMuscles: [], category: 'isolation', equipment: 'Polea' },
];

export const BIG_THREE_IDS = {
  benchPress: 'bench_press',
  squat: 'squat',
  deadlift: 'deadlift',
};

export const getExerciseById = (id: string): Exercise | undefined =>
  EXERCISE_DB.find(e => e.id === id);

export const getExercisesByMuscle = (muscle: string): Exercise[] =>
  EXERCISE_DB.filter(e => e.primaryMuscle === muscle || e.secondaryMuscles.includes(muscle as any));
