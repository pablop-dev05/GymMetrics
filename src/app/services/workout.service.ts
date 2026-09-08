import { Injectable, inject, signal } from '@angular/core';
import { Exercise, ExerciseBlock, Workout, WorkoutSet } from '../models/db';
import { toISODate } from '../models/ui';
import { AuthService } from './auth.service';
import { ExerciseService } from './exercise.service';
import { SupabaseService } from './supabase.service';

/** Entreno de un día concreto con sus series agrupadas por ejercicio. */
export interface DayWorkout {
  workout: Workout | null;
  blocks: ExerciseBlock[];
}

@Injectable({ providedIn: 'root' })
export class WorkoutService {
  private readonly sb = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private readonly exercises = inject(ExerciseService);

  private readonly _day = signal<DayWorkout>({ workout: null, blocks: [] });
  private readonly _date = signal<string>(toISODate());
  private readonly _loading = signal(false);

  readonly day = this._day.asReadonly();
  readonly date = this._date.asReadonly();
  readonly loading = this._loading.asReadonly();

  /** Carga (sin crear) el entreno de una fecha. */
  async loadDay(date: string): Promise<void> {
    this._date.set(date);
    this._loading.set(true);
    try {
      await this.exercises.load();
      const uid = this.auth.user()?.id;
      if (!uid) return;

      const { data: workouts, error } = await this.sb.client
        .from('workouts')
        .select('*')
        .eq('user_id', uid)
        .eq('date', date)
        .order('created_at')
        .limit(1);
      if (error) throw new Error(this.sb.humanError(error));

      const workout = (workouts?.[0] as Workout) ?? null;
      if (!workout) {
        this._day.set({ workout: null, blocks: [] });
        return;
      }

      const { data: sets } = await this.sb.client
        .from('workout_sets')
        .select('*')
        .eq('workout_id', workout.id)
        .order('exercise_id')
        .order('set_number');

      this._day.set({ workout, blocks: this.group((sets ?? []) as WorkoutSet[]) });
    } finally {
      this._loading.set(false);
    }
  }

  /** Devuelve el entreno del día, creándolo si aún no existe. */
  async ensureWorkout(routineId: string | null = null, name: string | null = null): Promise<Workout> {
    const existing = this._day().workout;
    if (existing) return existing;

    const uid = this.auth.user()!.id;
    const { data, error } = await this.sb.client
      .from('workouts')
      .insert({
        user_id: uid,
        date: this._date(),
        routine_id: routineId,
        name,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw new Error(this.sb.humanError(error));

    const workout = data as Workout;
    this._day.update((d) => ({ ...d, workout }));
    return workout;
  }

  async addSet(exercise: Exercise, values: Partial<WorkoutSet>): Promise<void> {
    const workout = await this.ensureWorkout();
    const block = this._day().blocks.find((b) => b.exercise.id === exercise.id);
    const setNumber = (block?.sets.at(-1)?.set_number ?? 0) + 1;

    const { data, error } = await this.sb.client
      .from('workout_sets')
      .insert({
        workout_id: workout.id,
        exercise_id: exercise.id,
        user_id: this.auth.user()!.id,
        set_number: setNumber,
        reps: values.reps ?? null,
        weight_kg: values.weight_kg ?? null,
        duration_seconds: values.duration_seconds ?? null,
        distance_m: values.distance_m ?? null,
        rpe: values.rpe ?? null,
        is_warmup: values.is_warmup ?? false,
        notes: values.notes ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(this.sb.humanError(error));
    this.applyLocal((sets) => [...sets, data as WorkoutSet]);
  }

  async updateSet(id: string, patch: Partial<WorkoutSet>): Promise<void> {
    const { data, error } = await this.sb.client
      .from('workout_sets')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(this.sb.humanError(error));
    this.applyLocal((sets) => sets.map((s) => (s.id === id ? (data as WorkoutSet) : s)));
  }

  async removeSet(id: string): Promise<void> {
    const { error } = await this.sb.client.from('workout_sets').delete().eq('id', id);
    if (error) throw new Error(this.sb.humanError(error));
    this.applyLocal((sets) => sets.filter((s) => s.id !== id));
  }

  /** Copia las series del último día que se entrenó ese ejercicio (repetir entreno). */
  async lastSetsFor(exerciseId: string): Promise<WorkoutSet[]> {
    const uid = this.auth.user()?.id;
    if (!uid) return [];
    const { data } = await this.sb.client
      .from('workout_sets')
      .select('*, workouts!inner(date)')
      .eq('user_id', uid)
      .eq('exercise_id', exerciseId)
      .neq('workout_id', this._day().workout?.id ?? '00000000-0000-0000-0000-000000000000')
      .order('performed_at', { ascending: false })
      .limit(6);
    return ((data ?? []) as WorkoutSet[]).reverse();
  }

  /** Vuelca los ejercicios de una rutina en el entreno del día, sin series. */
  async prefillFromRoutine(routineId: string, exerciseIds: string[], name: string): Promise<void> {
    await this.ensureWorkout(routineId, name);
    const map = this.exercises.byId();
    this._day.update((d) => {
      const present = new Set(d.blocks.map((b) => b.exercise.id));
      const extra = exerciseIds
        .filter((id) => !present.has(id) && map.has(id))
        .map((id) => this.emptyBlock(map.get(id)!));
      return { ...d, blocks: [...d.blocks, ...extra] };
    });
  }

  /** Añade un ejercicio vacío al día (aún sin series registradas). */
  addExerciseBlock(exercise: Exercise): void {
    this._day.update((d) =>
      d.blocks.some((b) => b.exercise.id === exercise.id)
        ? d
        : { ...d, blocks: [...d.blocks, this.emptyBlock(exercise)] },
    );
  }

  removeExerciseBlock(exerciseId: string): void {
    this._day.update((d) => ({ ...d, blocks: d.blocks.filter((b) => b.exercise.id !== exerciseId) }));
  }

  async finish(): Promise<void> {
    const workout = this._day().workout;
    if (!workout) return;
    await this.sb.client
      .from('workouts')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', workout.id);
    this._day.update((d) => ({
      ...d,
      workout: d.workout ? { ...d.workout, ended_at: new Date().toISOString() } : null,
    }));
  }

  // -- internos ---------------------------------------------------------------

  private emptyBlock(exercise: Exercise): ExerciseBlock {
    return { exercise, sets: [], volumeKg: 0, topWeightKg: null, totalReps: 0, totalSeconds: 0 };
  }

  /** Reaplica una transformación sobre todas las series y recalcula los agregados. */
  private applyLocal(fn: (sets: WorkoutSet[]) => WorkoutSet[]): void {
    const flat = fn(this._day().blocks.flatMap((b) => b.sets));
    const kept = this._day().blocks.filter((b) => !flat.some((s) => s.exercise_id === b.exercise.id));
    this._day.update((d) => ({
      ...d,
      blocks: [...this.group(flat), ...kept.map((b) => this.emptyBlock(b.exercise))],
    }));
  }

  private group(sets: WorkoutSet[]): ExerciseBlock[] {
    const map = this.exercises.byId();
    const acc = new Map<string, WorkoutSet[]>();
    for (const s of sets) {
      acc.set(s.exercise_id, [...(acc.get(s.exercise_id) ?? []), s]);
    }
    return [...acc.entries()]
      .filter(([id]) => map.has(id))
      .map(([id, list]) => {
        const ordered = [...list].sort((a, b) => a.set_number - b.set_number);
        const working = ordered.filter((s) => !s.is_warmup);
        return {
          exercise: map.get(id)!,
          sets: ordered,
          volumeKg: working.reduce((t, s) => t + (s.weight_kg ?? 0) * (s.reps ?? 0), 0),
          topWeightKg: working.reduce<number | null>(
            (max, s) => (s.weight_kg != null && (max == null || s.weight_kg > max) ? s.weight_kg : max),
            null,
          ),
          totalReps: working.reduce((t, s) => t + (s.reps ?? 0), 0),
          totalSeconds: ordered.reduce((t, s) => t + (s.duration_seconds ?? 0), 0),
        };
      });
  }
}
