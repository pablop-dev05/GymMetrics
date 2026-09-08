import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MetricsService } from '../../services/metrics.service';
import { WorkoutService } from '../../services/workout.service';
import { addDays, toISODate, weekdayIndex, WEEKDAYS } from '../../models/ui';
import { DurationPipe } from '../../pipes/duration.pipe';
import { MusclePipe } from '../../pipes/muscle.pipe';
import { SmartDatePipe } from '../../pipes/smart-date.pipe';
import { WeightPipe } from '../../pipes/weight.pipe';
import { ChartCanvas } from '../charts/chart';
import { muscleSplitChart, weeklyVolumeChart } from '../charts/chart-presets';
import { EmptyState } from '../ui/empty-state/empty-state';

/** Pantalla de métricas y gráficos del día seleccionado. */
@Component({
  selector: 'app-dashboard',
  imports: [ChartCanvas, EmptyState, DurationPipe, MusclePipe, SmartDatePipe, WeightPipe],
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

  protected readonly muscleChart = computed(() => muscleSplitChart(this.metrics()?.muscles ?? []));

  protected readonly muscleLegend = computed(() => {
    const rows = [...(this.metrics()?.muscles ?? [])].sort((a, b) => b.volume_kg - a.volume_kg);
    const total = rows.reduce((t, r) => t + Number(r.volume_kg), 0) || 1;
    return rows.slice(0, 5).map((r) => ({
      group: r.muscle_group,
      pct: Math.round((Number(r.volume_kg) / total) * 100),
      sets: r.sets,
    }));
  });

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
