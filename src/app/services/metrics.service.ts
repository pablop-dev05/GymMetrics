import { Injectable, inject, signal } from '@angular/core';
import { DailySummary, ExerciseProgress, MuscleVolume, PersonalRecord } from '../models/db';
import { addDays, toISODate } from '../models/ui';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

/** Todo lo que pinta la pantalla de métricas de un día. */
export interface DayMetrics {
  today: DailySummary | null;
  week: DailySummary[];       // últimos 7 días, incluido el actual
  muscles: MuscleVolume[];    // reparto del día
  records: PersonalRecord[];  // récords logrados hoy
  streak: number;             // días consecutivos entrenando
}

@Injectable({ providedIn: 'root' })
export class MetricsService {
  private readonly sb = inject(SupabaseService);
  private readonly auth = inject(AuthService);

  private readonly _metrics = signal<DayMetrics | null>(null);
  private readonly _loading = signal(false);

  readonly metrics = this._metrics.asReadonly();
  readonly loading = this._loading.asReadonly();

  async loadDay(date = toISODate()): Promise<void> {
    const uid = this.auth.user()?.id;
    if (!uid) return;
    this._loading.set(true);
    try {
      const from = addDays(date, -29);

      const [summaries, muscles, records] = await Promise.all([
        this.sb.client
          .from('v_daily_summary')
          .select('*')
          .gte('date', from)
          .lte('date', date)
          .order('date'),
        this.sb.client.from('v_muscle_volume').select('*').eq('date', date),
        this.sb.client.from('v_personal_records').select('*').eq('achieved_on', date),
      ]);

      const all = (summaries.data ?? []) as DailySummary[];
      const byDate = new Map(all.map((s) => [s.date, s]));

      const week = Array.from({ length: 7 }, (_, i) => {
        const d = addDays(date, i - 6);
        return (
          byDate.get(d) ?? {
            user_id: uid, date: d, workouts: 0, total_sets: 0,
            total_reps: 0, volume_kg: 0, duration_seconds: 0, exercises: 0,
          }
        );
      });

      this._metrics.set({
        today: byDate.get(date) ?? null,
        week,
        muscles: (muscles.data ?? []) as MuscleVolume[],
        records: (records.data ?? []) as PersonalRecord[],
        streak: this.streak(byDate, date),
      });
    } finally {
      this._loading.set(false);
    }
  }

  /** Evolución de un ejercicio para el gráfico de progreso. */
  async exerciseProgress(exerciseId: string, days = 90): Promise<ExerciseProgress[]> {
    const { data } = await this.sb.client
      .from('v_exercise_progress')
      .select('*')
      .eq('exercise_id', exerciseId)
      .gte('date', addDays(toISODate(), -days))
      .order('date');
    return (data ?? []) as ExerciseProgress[];
  }

  async personalRecords(): Promise<PersonalRecord[]> {
    const { data } = await this.sb.client
      .from('v_personal_records')
      .select('*')
      .order('est_1rm_kg', { ascending: false })
      .limit(20);
    return (data ?? []) as PersonalRecord[];
  }

  /** Días consecutivos con al menos una serie, contando hacia atrás desde `date`. */
  private streak(byDate: Map<string, DailySummary>, date: string): number {
    let n = 0;
    for (let i = 0; i < 30; i++) {
      const d = addDays(date, -i);
      const s = byDate.get(d);
      if (s && s.total_sets > 0) n++;
      else if (i > 0) break; // que hoy aún esté vacío no rompe la racha
    }
    return n;
  }
}
