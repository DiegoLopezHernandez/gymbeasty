// ─── 1RM Calculators ─────────────────────────────────────────────────────────

/** Epley formula: weight × (1 + reps/30) */
export const calculate1RM = (weight: number, reps: number): number => {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
};

/** Wilks Score for powerlifting total relative to bodyweight */
export const calculateWilks = (total: number, bodyWeightKg: number, isMale = true): number => {
  const a = isMale ? -216.0475144 : 594.31747775582;
  const b = isMale ? 16.2606339 : -27.23842536447;
  const c = isMale ? -0.002388645 : 0.82112226871;
  const d = isMale ? -0.00113732 : -0.00930733913;
  const e = isMale ? 7.01863e-6 : 4.731582e-5;
  const f = isMale ? -1.291e-8 : -9.054e-8;
  const bw = bodyWeightKg;
  const coeff = 500 / (a + b * bw + c * bw ** 2 + d * bw ** 3 + e * bw ** 4 + f * bw ** 5);
  return Math.round(total * coeff * 10) / 10;
};

// ─── Strength Standards ───────────────────────────────────────────────────────

export type StrengthLevel = 'beginner' | 'novice' | 'intermediate' | 'advanced' | 'elite';

interface StrengthStandard {
  exercise: string;
  bodyweight: number;
  levels: Record<StrengthLevel, number>;
}

const STRENGTH_STANDARDS: StrengthStandard[] = [
  { exercise: 'bench_press', bodyweight: 80, levels: { beginner: 50, novice: 70, intermediate: 90, advanced: 115, elite: 145 } },
  { exercise: 'squat', bodyweight: 80, levels: { beginner: 60, novice: 90, intermediate: 115, advanced: 150, elite: 190 } },
  { exercise: 'deadlift', bodyweight: 80, levels: { beginner: 80, novice: 110, intermediate: 145, advanced: 190, elite: 235 } },
];

export const getStrengthLevel = (exerciseId: string, weight1RM: number): StrengthLevel => {
  const std = STRENGTH_STANDARDS.find(s => s.exercise === exerciseId);
  if (!std) return 'beginner';
  const { levels } = std;
  if (weight1RM >= levels.elite) return 'elite';
  if (weight1RM >= levels.advanced) return 'advanced';
  if (weight1RM >= levels.intermediate) return 'intermediate';
  if (weight1RM >= levels.novice) return 'novice';
  return 'beginner';
};

export const getStrengthLevelLabel = (level: StrengthLevel): string => ({
  beginner: 'Principiante',
  novice: 'Novato',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
  elite: 'Élite',
}[level]);

export const getStrengthLevelColor = (level: StrengthLevel): string => ({
  beginner: '#888888',
  novice: '#4CAF50',
  intermediate: '#2196F3',
  advanced: '#9C27B0',
  elite: '#FF4500',
}[level]);

// ─── Date Helpers ─────────────────────────────────────────────────────────────

export const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
};

export const getDaysSince = (iso: string): number => {
  const diff = Date.now() - new Date(iso).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

export const isToday = (iso: string): boolean => {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
};

export const isYesterday = (iso: string): boolean => {
  const d = new Date(iso);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.toDateString() === yesterday.toDateString();
};

// ─── Volume Calculation ───────────────────────────────────────────────────────

export const calculateVolume = (weight: number, reps: number, sets: number): number =>
  weight * reps * sets;

export const formatWeight = (kg: number): string =>
  kg >= 1000 ? `${(kg / 1000).toFixed(1)}t` : `${kg}kg`;

// ─── Streak Calculation ───────────────────────────────────────────────────────

export const calculateStreak = (workoutDates: string[]): number => {
  if (workoutDates.length === 0) return 0;
  const sorted = [...workoutDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const latest = sorted[0];
  if (!isToday(latest) && !isYesterday(latest)) return 0;

  const uniqueDays = [...new Set(sorted.map(d => new Date(d).toDateString()))];
  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]);
    const curr = new Date(uniqueDays[i]);
    const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
    if (Math.round(diff) === 1) streak++;
    else break;
  }
  return streak;
};

// ─── XP Calculation ───────────────────────────────────────────────────────────

export const calculateXPForWorkout = (durationMinutes: number, exerciseCount: number, isPR: boolean): number => {
  let xp = 60; // base
  xp += Math.min(durationMinutes, 120);
  xp += exerciseCount * 12;
  if (isPR) xp += 120;
  return xp;
};

// XP required to reach each level (cumulative)
// Level 1 = 0 XP (start), ramps up steeply after level 10
export const LEVEL_XP_THRESHOLDS: number[] = [
  0,      // Lv1  🛋️
  200,    // Lv2  🍕
  450,    // Lv3  💤
  750,    // Lv4  🐌
  1100,   // Lv5  🚶
  1500,   // Lv6  🧍
  2000,   // Lv7  😅
  2600,   // Lv8  🏋️
  3300,   // Lv9  🔰
  4200,   // Lv10 🪶
  5300,   // Lv11 💪
  6700,   // Lv12 📈
  8400,   // Lv13 🔁
  10500,  // Lv14 🧱
  13000,  // Lv15 🥩
  16000,  // Lv16 ⚙️
  19500,  // Lv17 🦍
  23500,  // Lv18 🔥
  28000,  // Lv19 🛡️
  33000,  // Lv20 🐂
  39000,  // Lv21 ⚡
  46000,  // Lv22 🧨
  54000,  // Lv23 🏔️
  63000,  // Lv24 👑
  73000,  // Lv25 🧿
  85000,  // Lv26
  99000,  // Lv27
  115000, // Lv28
  133000, // Lv29
  153000, // Lv30
];

export const RANK_DATA: { emoji: string; name: string; color: string }[] = [
  { emoji: '🛋️',  name: 'Modo Sofá',              color: '#888888' },
  { emoji: '🍕',  name: 'Deportista de Sillón',    color: '#999999' },
  { emoji: '💤',  name: 'Experto en Excusas',       color: '#AAAAAA' },
  { emoji: '🐌',  name: 'Caracol Motivado',         color: '#AABB88' },
  { emoji: '🚶',  name: 'Caminante Casual',         color: '#88BB99' },
  { emoji: '🧍',  name: 'Humano Funcional',         color: '#77BBAA' },
  { emoji: '😅',  name: 'Sobreviviente del Cardio', color: '#66BBCC' },
  { emoji: '🏋️', name: 'Visitante del Gimnasio',   color: '#55AADD' },
  { emoji: '🔰',  name: 'Novato del Hierro',        color: '#4499EE' },
  { emoji: '🪶',  name: 'Aprendiz Débil',           color: '#4488FF' },
  { emoji: '💪',  name: 'Aprendiz del Hierro',      color: '#5577FF' },
  { emoji: '📈',  name: 'En Progreso',              color: '#6666FF' },
  { emoji: '🔁',  name: 'Habitual del Gym',         color: '#7755EE' },
  { emoji: '🧱',  name: 'Constructor de Base',      color: '#8844DD' },
  { emoji: '🥩',  name: 'Consumidor de Proteína',   color: '#9933CC' },
  { emoji: '⚙️',  name: 'Máquina en Marcha',        color: '#CC4400' },
  { emoji: '🦍',  name: 'Gorila en Formación',      color: '#DD5500' },
  { emoji: '🔥',  name: 'Forjado en Hierro',        color: '#EE6600' },
  { emoji: '🛡️', name: 'Guerrero del Gym',          color: '#FF7700' },
  { emoji: '🐂',  name: 'Toro del Rack',            color: '#FF5500' },
  { emoji: '⚡',  name: 'Potencia Humana',           color: '#FF4400' },
  { emoji: '🧨',  name: 'Bestia del Hierro',        color: '#FF3300' },
  { emoji: '🏔️', name: 'Titán del Gimnasio',        color: '#FF2200' },
  { emoji: '👑',  name: 'Maestro del Hierro',       color: '#FF8800' },
  { emoji: '🧿',  name: 'Dios del Hierro',          color: '#FFAA00' },
  { emoji: '🌋',  name: 'Fuerza Primordial',        color: '#FF5014' },
  { emoji: '💎',  name: 'Diamante Vivo',            color: '#00D4FF' },
  { emoji: '🌪️', name: 'Tormenta de Acero',        color: '#AA88FF' },
  { emoji: '☄️',  name: 'Impacto Cósmico',         color: '#FF88AA' },
  { emoji: '🔱',  name: 'Leyenda Absoluta',         color: '#FFD700' },
];

export const getAthleteProgress = (workouts: number, xp: number): number => {
  // Returns level 1-30 based on XP
  let level = 1;
  for (let i = LEVEL_XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_XP_THRESHOLDS[i]) { level = i + 1; break; }
  }
  return Math.min(30, level);
};

export const getLevelProgress = (xp: number): { level: number; pct: number; xpInLevel: number; xpNeeded: number } => {
  const level = getAthleteProgress(0, xp);
  const idx = level - 1;
  const current = LEVEL_XP_THRESHOLDS[idx] || 0;
  const next = LEVEL_XP_THRESHOLDS[idx + 1] || LEVEL_XP_THRESHOLDS[idx];
  const xpInLevel = xp - current;
  const xpNeeded = next - current;
  const pct = xpNeeded > 0 ? Math.min(1, xpInLevel / xpNeeded) : 1;
  return { level, pct, xpInLevel, xpNeeded };
};

export const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).substr(2);
