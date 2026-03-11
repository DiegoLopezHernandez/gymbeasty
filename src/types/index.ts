export type MuscleGroup =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps'
  | 'forearms' | 'abs' | 'quads' | 'hamstrings' | 'glutes'
  | 'calves' | 'traps' | 'lats';

export type ExerciseCategory = 'compound' | 'isolation' | 'cardio' | 'stretching';

export interface Exercise {
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  category: ExerciseCategory;
  equipment: string;
  description?: string;
  isCustom?: boolean;
}

export interface WorkoutSet {
  id: string;
  exerciseId: string;
  weight: number;
  reps: number;
  isWarmup?: boolean;
  completedAt: string;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  sets: WorkoutSet[];
  notes?: string;
}

export interface Workout {
  id: string;
  name: string;
  date: string;
  duration: number;
  exercises: WorkoutExercise[];
  notes?: string;
  isManual?: boolean;
}

export interface RoutineExercise {
  exerciseId: string;
  targetSets: number;
  targetReps: string;
  targetWeight?: number;
  restSeconds: number;
}

export interface Routine {
  id: string;
  name: string;
  description?: string;
  exercises: RoutineExercise[];
  createdAt: string;
}

export type BigThreeExercise = 'benchPress' | 'squat' | 'deadlift';

export interface PersonalRecord {
  exerciseId: string;
  weight: number;
  reps: number;
  estimated1RM: number;
  date: string;
}

export type GoalType = 'weight_lift' | 'consistency' | 'body_weight' | 'volume';

export interface Goal {
  id: string;
  type: GoalType;
  exerciseId?: string;
  muscleGroup?: MuscleGroup;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline?: string;
  createdAt: string;
  completedAt?: string;
  title: string;
}

export interface BodyWeightEntry {
  id: string;
  weight: number;
  date: string;
  notes?: string;
}

export interface BodyWeightGoal {
  targetWeight: number;
  targetDate?: string;
  direction: 'lose' | 'gain' | 'maintain';
  height: number;
}

export type AthleteTier = number; // 1-30 level system

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  condition: 'workouts_count' | 'streak' | 'pr_set' | 'volume_total' | 'big3_milestone';
  threshold: number;
}

export interface GymStats {
  totalWorkouts: number;
  currentStreak: number;
  longestStreak: number;
  totalVolume: number;
  totalDuration: number;
  lastWorkoutDate?: string;
  athleteTier: AthleteTier;
  gymLevel: number;
  xp: number;
}

export type MuscleStatus = 'neutral' | 'worked_recently' | 'has_goal';

export interface AppState {
  workouts: Workout[];
  routines: Routine[];
  exercises: Exercise[];
  goals: Goal[];
  prs: PersonalRecord[];
  stats: GymStats;
  achievements: Achievement[];
  activeWorkout: ActiveWorkout | null;
  bodyWeightEntries: BodyWeightEntry[];
  bodyWeightGoal: BodyWeightGoal | null;
}

export interface ActiveWorkout {
  routineId?: string;
  name: string;
  startedAt: string;
  exercises: WorkoutExercise[];
  restTimerActive: boolean;
  restTimeRemaining: number;
  restTimerTotal: number;
}
