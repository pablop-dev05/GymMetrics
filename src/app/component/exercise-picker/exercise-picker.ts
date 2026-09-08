import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Equipment, Exercise, ExerciseKind, MuscleGroup } from '../../models/db';
import { MUSCLE_GROUPS } from '../../models/ui';
import { ExerciseService } from '../../services/exercise.service';
import { ToastService } from '../../services/toast.service';
import { MusclePipe } from '../../pipes/muscle.pipe';
import { Modal } from '../ui/modal/modal';

/** Modal de selección de ejercicio del catálogo, con alta rápida de ejercicios propios. */
@Component({
  selector: 'app-exercise-picker',
  imports: [FormsModule, Modal, MusclePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './exercise-picker.html',
  styleUrl: './exercise-picker.scss',
})
export class ExercisePicker {
  private readonly exercises = inject(ExerciseService);
  private readonly toast = inject(ToastService);

  readonly pick = output<Exercise>();
  readonly close = output<void>();

  protected readonly groups = MUSCLE_GROUPS;
  protected readonly term = signal('');
  protected readonly muscle = signal<MuscleGroup | 'todos'>('todos');
  protected readonly creating = signal(false);
  protected readonly saving = signal(false);

  protected newName = '';
  protected newMuscle: MuscleGroup = 'pecho';
  protected newEquipment: Equipment = 'barra';
  protected newKind: ExerciseKind = 'fuerza';

  protected readonly results = computed(() => {
    this.exercises.all(); // dependencia explícita del catálogo
    return this.exercises.search(this.term(), this.muscle());
  });

  protected setTerm(value: string): void {
    this.term.set(value);
  }

  protected async createExercise(): Promise<void> {
    if (!this.newName.trim() || this.saving()) return;
    this.saving.set(true);
    try {
      const created = await this.exercises.create({
        name: this.newName.trim(),
        muscle_group: this.newMuscle,
        equipment: this.newEquipment,
        kind: this.newKind,
      });
      this.toast.ok('Ejercicio creado');
      this.pick.emit(created);
    } catch (e) {
      this.toast.error(e);
    } finally {
      this.saving.set(false);
    }
  }
}
