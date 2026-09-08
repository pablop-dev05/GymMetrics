import { computed, Injectable, inject, signal } from '@angular/core';
import { Exercise, Routine, RoutineExercise, RoutineFull } from '../models/db';
import { AuthService } from './auth.service';
import { ExerciseService } from './exercise.service';
import { SupabaseService } from './supabase.service';

/** Ejercicio tal y como lo edita el usuario en el editor de rutinas. */
export interface RoutineExerciseDraft {
  exercise_id: string;
  target_sets: number | null;
  target_reps: number | null;
  target_weight_kg: number | null;
  target_duration_seconds: number | null;
  rest_seconds: number | null;
}

@Injectable({ providedIn: 'root' })
export class RoutineService {
  private readonly sb = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private readonly exercises = inject(ExerciseService);

  private readonly _routines = signal<RoutineFull[]>([]);
  private readonly _loading = signal(false);

  readonly routines = this._routines.asReadonly();
  readonly loading = this._loading.asReadonly();

  /** Rutinas indexadas por día de la semana (0 = lunes). */
  readonly byWeekday = computed(() => {
    const map = new Map<number, RoutineFull[]>();
    for (const r of this._routines()) {
      for (const d of r.days) map.set(d, [...(map.get(d) ?? []), r]);
    }
    return map;
  });

  async load(): Promise<void> {
    const uid = this.auth.user()?.id;
    if (!uid) return;
    this._loading.set(true);
    try {
      await this.exercises.load();
      const catalog = this.exercises.byId();

      const [routines, days, items] = await Promise.all([
        this.sb.client.from('routines').select('*').eq('is_archived', false).order('created_at'),
        this.sb.client.from('routine_days').select('*'),
        this.sb.client.from('routine_exercises').select('*').order('position'),
      ]);

      const dayMap = new Map<string, number[]>();
      for (const d of (days.data ?? []) as { routine_id: string; weekday: number }[]) {
        dayMap.set(d.routine_id, [...(dayMap.get(d.routine_id) ?? []), d.weekday].sort());
      }

      const itemMap = new Map<string, (RoutineExercise & { exercise: Exercise })[]>();
      for (const it of (items.data ?? []) as RoutineExercise[]) {
        const exercise = catalog.get(it.exercise_id);
        if (!exercise) continue;
        itemMap.set(it.routine_id, [...(itemMap.get(it.routine_id) ?? []), { ...it, exercise }]);
      }

      this._routines.set(
        ((routines.data ?? []) as Routine[]).map((r) => ({
          ...r,
          days: dayMap.get(r.id) ?? [],
          exercises: itemMap.get(r.id) ?? [],
        })),
      );
    } finally {
      this._loading.set(false);
    }
  }

  /** Alta o edición completa de una rutina (cabecera + días + ejercicios). */
  async save(input: {
    id?: string;
    name: string;
    description: string | null;
    color: string;
    days: number[];
    exercises: RoutineExerciseDraft[];
  }): Promise<void> {
    const uid = this.auth.user()!.id;
    const header = {
      user_id: uid,
      name: input.name,
      description: input.description,
      color: input.color,
    };

    const { data, error } = input.id
      ? await this.sb.client.from('routines').update(header).eq('id', input.id).select().single()
      : await this.sb.client.from('routines').insert(header).select().single();
    if (error) throw new Error(this.sb.humanError(error));
    const routineId = (data as Routine).id;

    // Días y ejercicios se reescriben enteros: es una lista corta y evita diffs frágiles.
    await this.sb.client.from('routine_days').delete().eq('routine_id', routineId);
    if (input.days.length) {
      const { error: dErr } = await this.sb.client
        .from('routine_days')
        .insert(input.days.map((weekday) => ({ routine_id: routineId, weekday, user_id: uid })));
      if (dErr) throw new Error(this.sb.humanError(dErr));
    }

    await this.sb.client.from('routine_exercises').delete().eq('routine_id', routineId);
    if (input.exercises.length) {
      const { error: eErr } = await this.sb.client.from('routine_exercises').insert(
        input.exercises.map((ex, i) => ({ ...ex, routine_id: routineId, user_id: uid, position: i })),
      );
      if (eErr) throw new Error(this.sb.humanError(eErr));
    }

    await this.load();
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.sb.client.from('routines').delete().eq('id', id);
    if (error) throw new Error(this.sb.humanError(error));
    this._routines.update((list) => list.filter((r) => r.id !== id));
  }
}
