import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Exercise, RoutineFull } from '../../models/db';
import { WEEKDAYS } from '../../models/ui';
import { RoutineExerciseDraft, RoutineService } from '../../services/routine.service';
import { ToastService } from '../../services/toast.service';
import { MusclePipe } from '../../pipes/muscle.pipe';
import { WeekdayPipe } from '../../pipes/weekday.pipe';
import { ExercisePicker } from '../exercise-picker/exercise-picker';
import { Modal } from '../ui/modal/modal';

const COLORS = ['#38e2c4', '#7c5cff', '#ff6b6b', '#ffb347', '#b6ff5c', '#5cc8ff', '#f472b6'];

/** Modal de alta/edición de rutina: días, color y ejercicios con sus objetivos. */
@Component({
  selector: 'app-routine-editor',
  imports: [FormsModule, Modal, ExercisePicker, MusclePipe, WeekdayPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './routine-editor.html',
  styleUrl: './routine-editor.scss',
})
export class RoutineEditor {
  private readonly service = inject(RoutineService);
  private readonly toast = inject(ToastService);

  /** null para crear una rutina nueva. */
  readonly routine = input.required<RoutineFull | null>();
  readonly close = output<void>();

  protected readonly colors = COLORS;
  protected readonly weekdays = WEEKDAYS.map((_, i) => i);
  protected readonly pickerOpen = signal(false);
  protected readonly saving = signal(false);

  protected name = '';
  protected description = '';
  protected readonly color = signal(COLORS[0]);
  protected readonly days = signal<number[]>([]);
  protected readonly items = signal<(RoutineExerciseDraft & { exercise: Exercise })[]>([]);
  private hydrated = false;

  protected readonly title = computed(() => (this.routine() ? 'Editar rutina' : 'Nueva rutina'));

  constructor() {
    effect(() => this.hydrate());
  }

  private hydrate(): void {
    if (this.hydrated) return;
    this.hydrated = true;
    const r = this.routine();
    if (!r) return;
    this.name = r.name;
    this.description = r.description ?? '';
    this.color.set(r.color);
    this.days.set([...r.days]);
    this.items.set(
      r.exercises.map((e) => ({
        exercise: e.exercise,
        exercise_id: e.exercise_id,
        target_sets: e.target_sets,
        target_reps: e.target_reps,
        target_weight_kg: e.target_weight_kg,
        target_duration_seconds: e.target_duration_seconds,
        rest_seconds: e.rest_seconds,
      })),
    );
  }

  protected toggleDay(day: number): void {
    this.days.update((d) => (d.includes(day) ? d.filter((x) => x !== day) : [...d, day].sort()));
  }

  protected addExercise(exercise: Exercise): void {
    this.pickerOpen.set(false);
    if (this.items().some((i) => i.exercise_id === exercise.id)) {
      this.toast.show('Ese ejercicio ya está en la rutina');
      return;
    }
    this.items.update((list) => [
      ...list,
      {
        exercise,
        exercise_id: exercise.id,
        target_sets: 4,
        target_reps: exercise.tracks_reps ? 10 : null,
        target_weight_kg: null,
        target_duration_seconds: exercise.tracks_duration ? 60 : null,
        rest_seconds: 90,
      },
    ]);
  }

  protected patch(index: number, field: keyof RoutineExerciseDraft, raw: string): void {
    const value = raw === '' ? null : Number(raw.replace(',', '.'));
    this.items.update((list) =>
      list.map((it, i) =>
        i === index ? { ...it, [field]: value == null || Number.isNaN(value) ? null : value } : it,
      ),
    );
  }

  protected move(index: number, delta: number): void {
    const next = index + delta;
    this.items.update((list) => {
      if (next < 0 || next >= list.length) return list;
      const copy = [...list];
      [copy[index], copy[next]] = [copy[next], copy[index]];
      return copy;
    });
  }

  protected drop(index: number): void {
    this.items.update((list) => list.filter((_, i) => i !== index));
  }

  protected async submit(): Promise<void> {
    if (!this.name.trim()) {
      this.toast.show('Ponle un nombre a la rutina');
      return;
    }
    this.saving.set(true);
    try {
      await this.service.save({
        id: this.routine()?.id,
        name: this.name.trim(),
        description: this.description.trim() || null,
        color: this.color(),
        days: this.days(),
        exercises: this.items().map(({ exercise, ...draft }) => draft),
      });
      this.toast.ok('Rutina guardada');
      this.close.emit();
    } catch (e) {
      this.toast.error(e);
    } finally {
      this.saving.set(false);
    }
  }
}
