import { Achievement } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_workout', title: 'Primera Sangre', description: 'Completa tu primer entreno', icon: '🔥', condition: 'workouts_count', threshold: 1 },
  { id: 'ten_workouts', title: 'En Racha', description: '10 entrenos completados', icon: '💪', condition: 'workouts_count', threshold: 10 },
  { id: 'thirty_workouts', title: 'Constante', description: '30 entrenos completados', icon: '⚡', condition: 'workouts_count', threshold: 30 },
  { id: 'hundred_workouts', title: 'Centurión', description: '100 entrenos completados', icon: '🏆', condition: 'workouts_count', threshold: 100 },
  { id: 'streak_7', title: 'Semana Perfecta', description: '7 días de racha', icon: '🗓️', condition: 'streak', threshold: 7 },
  { id: 'streak_30', title: 'Mes Bestial', description: '30 días de racha', icon: '🌙', condition: 'streak', threshold: 30 },
  { id: 'streak_100', title: 'Imparable', description: '100 días de racha', icon: '☄️', condition: 'streak', threshold: 100 },
  { id: 'first_pr', title: 'Nuevo Límite', description: 'Establece tu primer PR', icon: '📈', condition: 'pr_set', threshold: 1 },
  { id: 'ten_prs', title: 'Rompe Récords', description: '10 PRs establecidos', icon: '💥', condition: 'pr_set', threshold: 10 },
  { id: 'volume_1000', title: 'Tonelada', description: 'Mueve 1.000 kg en total', icon: '🏋️', condition: 'volume_total', threshold: 1000 },
  { id: 'volume_10000', title: 'Diez Toneladas', description: 'Mueve 10.000 kg en total', icon: '🦍', condition: 'volume_total', threshold: 10000 },
  { id: 'volume_100000', title: 'Bestia Absoluta', description: 'Mueve 100.000 kg en total', icon: '👑', condition: 'volume_total', threshold: 100000 },
  { id: 'bench_100', title: 'Club de los 100', description: 'Press banca con 100kg', icon: '🎯', condition: 'big3_milestone', threshold: 100 },
  { id: 'squat_100', title: 'Piernas de Acero', description: 'Sentadilla con 100kg', icon: '🦵', condition: 'big3_milestone', threshold: 100 },
  { id: 'deadlift_100', title: 'Arrancado', description: 'Peso muerto con 100kg', icon: '⛓️', condition: 'big3_milestone', threshold: 100 },
  { id: 'bench_140', title: 'Planchazo Serio', description: 'Press banca con 140kg', icon: '🔱', condition: 'big3_milestone', threshold: 140 },
];

export const ATHLETE_TIERS = [
  { tier: 'rookie', label: 'Rookie', minWorkouts: 0, minXP: 0, color: '#888' },
  { tier: 'amateur', label: 'Amateur', minWorkouts: 10, minXP: 500, color: '#4CAF50' },
  { tier: 'intermediate', label: 'Intermedio', minWorkouts: 30, minXP: 2000, color: '#2196F3' },
  { tier: 'advanced', label: 'Avanzado', minWorkouts: 75, minXP: 6000, color: '#9C27B0' },
  { tier: 'elite', label: 'Élite', minWorkouts: 150, minXP: 15000, color: '#FF9800' },
  { tier: 'beast', label: 'BEAST', minWorkouts: 300, minXP: 40000, color: '#FF4500' },
];

export const GYM_LEVELS = [
  { level: 1, name: 'Garaje Oxidado', description: 'Un banco viejo y unas mancuernas', minXP: 0 },
  { level: 2, name: 'Sótano del Bloque', description: 'Algo de material básico', minXP: 200 },
  { level: 3, name: 'Gym Municipal', description: 'Equipamiento decente', minXP: 600 },
  { level: 4, name: 'Gym Comercial', description: 'Máquinas modernas', minXP: 1200 },
  { level: 5, name: 'Gym Serio', description: 'Plataformas de halterofilia', minXP: 2500 },
  { level: 6, name: 'Box de CrossFit', description: 'Barras, racks y anillas', minXP: 4500 },
  { level: 7, name: 'Gym de Culturismo', description: 'Espejos por todos lados', minXP: 7000 },
  { level: 8, name: 'Instalación Olímpica', description: 'Donde se forjan campeones', minXP: 12000 },
  { level: 9, name: 'Templo de la Fuerza', description: 'Leyendas entrenaron aquí', minXP: 20000 },
  { level: 10, name: 'Olimpo', description: 'El techo ya no existe', minXP: 35000 },
];
