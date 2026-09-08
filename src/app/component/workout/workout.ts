import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { Exercise, ExerciseBlock, RoutineFull, WorkoutSet } from '../../models/db';
import { addDays, toISODate, weekdayIndex } from '../../models/ui';
import { RoutineService } from '../../services/routine.service';
import { ToastService } from '../../services/toast.service';
import { WorkoutService } from '../../services/workout.service';
import { DurationPipe } from '../../pipes/duration.pipe';
import { IntensityPipe } from '../../pipes/intensity.pipe';
import { MusclePipe } from '../../pipes/muscle.pipe';
import { SmartDatePipe } from '../../pipes/smart-date.pipe';
import { WeightPipe } from '../../pipes/weight.pipe';
import { EmptyState } from '../ui/empty-state/empty-state';
import { ExercisePicker } from '../exercise-picker/exercise-picker';
import { SetEditor } from '../set-editor/set-editor';

/** Pantalla de carga de datos: series, pesos y tiempos del día. */
@Component({
  selector: 'app-workout',
  imports: [
    EmptyState, ExercisePicker, SetEditor,
    DurationPipe, IntensityPipe, MusclePipe, SmartDatePipe, WeightPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './workout.html',
  styleUrl: './workout.scss',
})
export class Workout implements OnDestroy {
  private readonly toast = inject(ToastService);
  private readonly routines = inject(RoutineService);
  protected readonly service = inject(WorkoutService);

  protected readonly date = signal(toISODate());
  protected readonly blocks = computed(() => this.service.day().blocks);
  protected readonly loading = this.service.loading;
  protected readonly isToday = computed(() => this.date() === toISODate());

  protected readonly pickerOpen = signal(false);
  protected readonly editor = signal<{
    exercise: Exercise;
    set: WorkoutSet | null;
    previous: Partial<WorkoutSet> | null;
  } | null>(null);

  /** Rutina asignada al día de la semana que se está viendo. */
  protected readonly suggested = computed<RoutineFull | null>(() => {
    const wd = weekdayIndex(new Date(`${this.date()}T00:00:00`));
    return this.routines.byWeekday().get(wd)?.[0] ?? null;
  });

  protected readonly totals = computed(() => {
    const blocks = this.blocks();
    return {
      sets: blocks.reduce((t, b) => t + b.sets.filter((s) => !s.is_warmup).length, 0),
      volume: blocks.reduce((t, b) => t + b.volumeKg, 0),
      cardioSeconds: blocks
        .filter((b) => b.exercise.kind === 'cardio')
        .reduce((t, b) => t + b.totalSeconds, 0),
    };
  });

  protected isCardio(block: ExerciseBlock): boolean {
    return block.exercise.kind === 'cardio';
  }

  // -- Cronómetro de descanso ---------------------------------------------------
  private readonly tick = signal(0);
  private restStart = 0;
  private timer?: ReturnType<typeof setInterval>;
  protected readonly resting = signal(false);
  protected readonly restSeconds = computed(() => {
    this.tick();
    return this.resting() ? Math.floor((Date.now() - this.restStart) / 1000) : 0;
  });

  constructor() {
    void this.reload();
    void this.routines.load();
  }

  ngOnDestroy(): void {
    this.stopRest();
  }

  protected async shiftDay(delta: number): Promise<void> {
    const next = addDays(this.date(), delta);
    if (next > toISODate()) return;
    this.date.set(next);
    await this.reload();
  }

  protected async loadRoutine(): Promise<void> {
    const routine = this.suggested();
    if (!routine) return;
    try {
      await this.service.prefillFromRoutine(
        routine.id,
        routine.exercises.map((e) => e.exercise_id),
        routine.name,
      );
      this.toast.ok(`Rutina «${routine.name}» cargada`);
    } catch (e) {
      this.toast.error(e);
    }
  }

  protected onPick(exercise: Exercise): void {
    this.service.addExerciseBlock(exercise);
    this.pickerOpen.set(false);
  }

  /** Abre el editor precargando la última serie de ese ejercicio. */
  protected async openNewSet(exercise: Exercise): Promise<void> {
    const block = this.blocks().find((b) => b.exercise.id === exercise.id);
    const last = block?.sets.at(-1);
    const previous = last ?? (await this.service.lastSetsFor(exercise.id)).at(-1) ?? null;
    this.editor.set({ exercise, set: null, previous });
  }

  protected openSet(exercise: Exercise, set: WorkoutSet): void {
    this.editor.set({ exercise, set, previous: null });
  }

  protected async saveSet(values: Partial<WorkoutSet>): Promise<void> {
    const ctx = this.editor();
    if (!ctx) return;
    try {
      if (ctx.set) {
        await this.service.updateSet(ctx.set.id, values);
      } else {
        await this.service.addSet(ctx.exercise, values);
        // Tras el cardio no se cronometra descanso: la sesión ya se cronometró entera.
        if (ctx.exercise.kind !== 'cardio') this.startRest();
      }
      this.editor.set(null);
    } catch (e) {
      this.toast.error(e);
    }
  }

  protected async deleteSet(id: string): Promise<void> {
    try {
      await this.service.removeSet(id);
      this.editor.set(null);
      this.toast.ok('Serie eliminada');
    } catch (e) {
      this.toast.error(e);
    }
  }

  protected removeBlock(exerciseId: string): void {
    this.service.removeExerciseBlock(exerciseId);
  }

  protected async finish(): Promise<void> {
    await this.service.finish();
    this.stopRest();
    this.toast.ok('¡Entreno cerrado! Buen trabajo 💪');
  }

  protected startRest(): void {
    this.stopRest();
    this.restStart = Date.now();
    this.resting.set(true);
    this.timer = setInterval(() => this.tick.update((n) => n + 1), 1000);
  }

  protected stopRest(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    this.resting.set(false);
  }

  private async reload(): Promise<void> {
    await this.service.loadDay(this.date());
  }
}
