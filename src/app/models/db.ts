/** Tipos espejo del esquema de Supabase (`supabase/migrations`). */

export type WeightUnit = 'kg' | 'lb';

export type MuscleGroup =
  | 'pecho' | 'espalda' | 'hombro' | 'biceps' | 'triceps' | 'antebrazo'
  | 'cuadriceps' | 'isquiotibiales' | 'gluteo' | 'gemelo' | 'core'
  | 'cardio' | 'cuerpo_completo';

export type Equipment =
  | 'barra' | 'mancuerna' | 'maquina' | 'polea' | 'peso_corporal'
  | 'kettlebell' | 'banda' | 'cardio' | 'otro';

export type ExerciseKind = 'fuerza' | 'cardio' | 'isometrico';

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  unit: WeightUnit;
  height_cm: number | null;
  birth_date: string | null;
  weekly_goal: number;
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: string;
  user_id: string | null;
  name: string;
  muscle_group: MuscleGroup;
  equipment: Equipment;
  kind: ExerciseKind;
  tracks_weight: boolean;
  tracks_reps: boolean;
  tracks_duration: boolean;
  tracks_distance: boolean;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoutineDay {
  routine_id: string;
  weekday: number; // 0 = lunes … 6 = domingo
  user_id: string;
}

export interface RoutineExercise {
  id: string;
  routine_id: string;
  exercise_id: string;
  user_id: string;
  position: number;
  target_sets: number | null;
  target_reps: number | null;
  target_weight_kg: number | null;
  target_duration_seconds: number | null;
  rest_seconds: number | null;
  notes: string | null;
  created_at: string;
}

/** Rutina con sus días y ejercicios ya resueltos. */
export interface RoutineFull extends Routine {
  days: number[];
  exercises: (RoutineExercise & { exercise: Exercise })[];
}

export interface Workout {
  id: string;
  user_id: string;
  routine_id: string | null;
  date: string; // YYYY-MM-DD
  name: string | null;
  notes: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSet {
  id: string;
  workout_id: string;
  exercise_id: string;
  user_id: string;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  duration_seconds: number | null;
  distance_m: number | null;
  rest_seconds: number | null;
  rpe: number | null;
  is_warmup: boolean;
  completed: boolean;
  notes: string | null;
  performed_at: string;
  created_at: string;
}

/** Series de un mismo ejercicio dentro de un entreno. */
export interface ExerciseBlock {
  exercise: Exercise;
  sets: WorkoutSet[];
  volumeKg: number;
  topWeightKg: number | null;
  totalReps: number;
  totalSeconds: number;
}

// ---- Vistas de métricas -----------------------------------------------------

export interface DailySummary {
  user_id: string;
  date: string;
  workouts: number;
  total_sets: number;
  total_reps: number;
  volume_kg: number;
  duration_seconds: number;
  exercises: number;
}

export interface ExerciseProgress {
  user_id: string;
  exercise_id: string;
  exercise_name: string;
  muscle_group: MuscleGroup;
  date: string;
  max_weight_kg: number | null;
  volume_kg: number;
  total_reps: number;
  sets: number;
  est_1rm_kg: number | null;
}

export interface MuscleVolume {
  user_id: string;
  date: string;
  muscle_group: MuscleGroup;
  volume_kg: number;
  sets: number;
}

export interface PersonalRecord {
  user_id: string;
  exercise_id: string;
  exercise_name: string;
  muscle_group: MuscleGroup;
  max_weight_kg: number | null;
  est_1rm_kg: number | null;
  achieved_on: string;
}
