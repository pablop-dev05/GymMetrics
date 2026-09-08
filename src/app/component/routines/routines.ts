import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RoutineFull } from '../../models/db';
import { WEEKDAYS, weekdayIndex } from '../../models/ui';
import { RoutineService } from '../../services/routine.service';
import { ToastService } from '../../services/toast.service';
import { DurationPipe } from '../../pipes/duration.pipe';
import { IntensityPipe } from '../../pipes/intensity.pipe';
import { MusclePipe } from '../../pipes/muscle.pipe';
import { WeekdayPipe } from '../../pipes/weekday.pipe';
import { EmptyState } from '../ui/empty-state/empty-state';
import { RoutineEditor } from '../routine-editor/routine-editor';

/** Pantalla de rutinas: qué se entrena cada día de la semana. */
@Component({
  selector: 'app-routines',
  imports: [EmptyState, RoutineEditor, DurationPipe, IntensityPipe, MusclePipe, WeekdayPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './routines.html',
  styleUrl: './routines.scss',
})
export class Routines {
  private readonly toast = inject(ToastService);
  protected readonly service = inject(RoutineService);

  protected readonly weekdays = WEEKDAYS.map((_, i) => i);
  protected readonly today = weekdayIndex(new Date());
  protected readonly editing = signal<RoutineFull | null | undefined>(undefined); // undefined = cerrado
  protected readonly confirmId = signal<string | null>(null);

  protected readonly week = computed(() =>
    this.weekdays.map((d) => ({ day: d, routines: this.service.byWeekday().get(d) ?? [] })),
  );

  constructor() {
    void this.service.load();
  }

  /** Grupos musculares que cubre una rutina, sin repetir. */
  protected muscles(routine: RoutineFull): string[] {
    return [...new Set(routine.exercises.map((e) => e.exercise.muscle_group))].slice(0, 4);
  }

  protected async remove(id: string): Promise<void> {
    try {
      await this.service.remove(id);
      this.confirmId.set(null);
      this.toast.ok('Rutina eliminada');
    } catch (e) {
      this.toast.error(e);
    }
  }
}
