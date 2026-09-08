import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MetricsService } from '../../services/metrics.service';
import { WorkoutService } from '../../services/workout.service';
import { addDays, INTENSITIES, MUSCLE_META, toISODate, weekdayIndex, WEEKDAYS } from '../../models/ui';
import { DurationPipe } from '../../pipes/duration.pipe';
import { IntensityPipe } from '../../pipes/intensity.pipe';
import { MusclePipe } from '../../pipes/muscle.pipe';
import { SmartDatePipe } from '../../pipes/smart-date.pipe';
import { WeightPipe } from '../../pipes/weight.pipe';
import { ChartCanvas } from '../charts/chart';
import { GroupShare, muscleSplitChart, weeklyVolumeChart } from '../charts/chart-presets';
import { EmptyState } from '../ui/empty-state/empty-state';

/** Pantalla de métricas y gráficos del día seleccionado. */
@Component({
  selector: 'app-dashboard',
  imports: [
    ChartCanvas, EmptyState,
    DurationPipe, IntensityPipe, MusclePipe, SmartDatePipe, WeightPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly metricsService = inject(MetricsService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  protected readonly workouts = inject(WorkoutService);

  protected readonly date = signal(toISODate());
  protected readonly loading = this.metricsService.loading;
  protected readonly metrics = this.metricsService.metrics;
  protected readonly blocks = computed(() => this.workouts.day().blocks);
  protected readonly isToday = computed(() => this.date() === toISODate());

  protected readonly greeting = computed(() => {
    const h = new Date().getHours();
    if (h < 6) return 'Aún despierto';
    if (h < 13) return 'Buenos días';
    if (h < 21) return 'Buenas tardes';
    return 'Buenas noches';
  });

  /** Volumen de los 7 últimos días; el día seleccionado va resaltado. */
  protected readonly weekChart = computed(() => {
    const week = this.metrics()?.week ?? [];
    return weeklyVolumeChart(
      week.map((d) => WEEKDAYS[weekdayIndex(new Date(`${d.date}T00:00:00`))]),
      week.map((d) => Number(d.volume_kg)),
      week.length - 1,
    );
  });

  /**
   * Reparto del día: todos los grupos trabajados valen lo mismo. Medirlo por kilos
   * dejaba el cardio siempre a 0%, así que la porción depende de cuántos grupos
   * has tocado, no de cuánto peso has movido.
   */
  protected readonly groupShares = computed<GroupShare[]>(() => {
    const rows = this.metrics()?.muscles ?? [];
    if (!rows.length) return [];

    const share = 100 / rows.length;
    return rows
      .map((r) => ({
        group: r.muscle_group,
        label: MUSCLE_META[r.muscle_group]?.label ?? r.muscle_group,
        color: MUSCLE_META[r.muscle_group]?.color ?? '#94a3b8',
        // Se redondea solo para mostrarlo; las porciones del donut son exactas.
        pct: Math.round(share),
        sets: r.sets,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  protected readonly muscleChart = computed(() => muscleSplitChart(this.groupShares()));

  /**
   * Reparto del tiempo de cardio del día por intensidad, en porcentaje, para
   * pintar la barra apilada.
   */
  protected readonly cardioSplit = computed(() => {
    const c = this.metrics()?.cardio;
    if (!c || !c.seconds) return [];
    const seconds: Record<string, number> = {
      suave: Number(c.seconds_suave),
      moderada: Number(c.seconds_moderada),
      vigorosa: Number(c.seconds_vigorosa),
      maxima: Number(c.seconds_maxima),
    };
    const total = Number(c.seconds);
    return INTENSITIES
      .map((key) => ({ key, seconds: seconds[key], pct: (seconds[key] / total) * 100 }))
      .filter((row) => row.seconds > 0);
  });

  /** Minutos de cardio acumulados en los últimos 7 días. */
  protected readonly cardioWeekMinutes = computed(() =>
    Math.round((this.metrics()?.cardioWeek ?? []).reduce((t, s) => t + s, 0) / 60),
  );

  constructor() {
    void this.reload();
  }

  protected async shiftDay(delta: number): Promise<void> {
    const next = addDays(this.date(), delta);
    if (next > toISODate()) return; // no se navega al futuro
    this.date.set(next);
    await this.reload();
  }

  protected async goToday(): Promise<void> {
    this.date.set(toISODate());
    await this.reload();
  }

  protected goTrain(): void {
    void this.router.navigate(['/entreno']);
  }

  private async reload(): Promise<void> {
    await Promise.all([
      this.metricsService.loadDay(this.date()),
      this.workouts.loadDay(this.date()),
    ]);
  }
}
