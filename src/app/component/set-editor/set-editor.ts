import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardioIntensity, Exercise, WorkoutSet } from '../../models/db';
import { INTENSITIES } from '../../models/ui';
import { AuthService } from '../../services/auth.service';
import { DurationPipe } from '../../pipes/duration.pipe';
import { IntensityPipe } from '../../pipes/intensity.pipe';
import { Modal } from '../ui/modal/modal';

const LB_PER_KG = 2.2046226218;

/**
 * Modal para crear o editar una serie. Los campos se adaptan al ejercicio:
 * el cardio se registra con tiempo e intensidad, nunca con peso ni repeticiones.
 */
@Component({
  selector: 'app-set-editor',
  imports: [FormsModule, Modal, DurationPipe, IntensityPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './set-editor.html',
  styleUrl: './set-editor.scss',
})
export class SetEditor implements OnDestroy {
  private readonly auth = inject(AuthService);

  readonly exercise = input.required<Exercise>();
  /** Serie existente a editar; null para crear una nueva. */
  readonly set = input<WorkoutSet | null>(null);
  /** Valores de la última serie registrada, para precargar. */
  readonly previous = input<Partial<WorkoutSet> | null>(null);

  readonly save = output<Partial<WorkoutSet>>();
  readonly remove = output<string>();
  readonly close = output<void>();

  protected readonly intensities = INTENSITIES;
  protected readonly unit = computed(() => this.auth.unit());
  protected readonly isEdit = computed(() => !!this.set());
  protected readonly isCardio = computed(() => this.exercise().kind === 'cardio');

  protected readonly weight = signal<number | null>(null);
  protected readonly reps = signal<number | null>(null);
  protected readonly seconds = signal<number | null>(null);
  protected readonly rpe = signal<number | null>(null);
  protected readonly intensity = signal<CardioIntensity | null>(null);
  protected readonly warmup = signal(false);
  private hydrated = false;

  /** Volumen de la serie de fuerza, actualizado mientras se escribe. */
  protected readonly volume = computed(() => {
    const w = this.weight() ?? 0;
    const r = this.reps() ?? 0;
    return w > 0 && r > 0 ? Math.round(w * r * 10) / 10 : null;
  });

  /** El cardio necesita tiempo; la fuerza puede guardarse solo con reps. */
  protected readonly canSave = computed(() => !this.isCardio() || (this.seconds() ?? 0) > 0);

  // -- Cronómetro ---------------------------------------------------------------
  protected readonly running = signal(false);
  private timer?: ReturnType<typeof setInterval>;
  private startedAt = 0;
  private baseline = 0;

  constructor() {
    // Los inputs ya están enlazados cuando corre el efecto: es el momento de precargar.
    effect(() => this.hydrate());
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  private hydrate(): void {
    if (this.hydrated) return;
    this.hydrated = true;
    const src = this.set() ?? this.previous();
    if (!src) return;
    this.weight.set(this.toDisplay(src.weight_kg ?? null));
    this.reps.set(src.reps ?? null);
    this.seconds.set(src.duration_seconds ?? null);
    this.intensity.set(src.intensity ?? null);
    this.rpe.set(this.set()?.rpe ?? null);
    this.warmup.set(this.set()?.is_warmup ?? false);
  }

  protected step(field: 'weight' | 'reps' | 'seconds', delta: number): void {
    const target = { weight: this.weight, reps: this.reps, seconds: this.seconds }[field];
    const next = Math.max(0, Math.round(((target() ?? 0) + delta) * 100) / 100);
    target.set(next || (field === 'weight' ? 0 : null));
  }

  protected onNumber(sig: 'weight' | 'reps' | 'seconds' | 'rpe', raw: string): void {
    const value = raw === '' ? null : Number(raw.replace(',', '.'));
    const target = { weight: this.weight, reps: this.reps, seconds: this.seconds, rpe: this.rpe }[sig];
    target.set(value == null || Number.isNaN(value) ? null : value);
  }

  /**
   * Arranca o para el cronómetro. El tiempo se recalcula contra el reloj en cada
   * pulso en vez de ir sumando segundos, para que no se desvíe en sesiones largas.
   */
  protected toggleTimer(): void {
    if (this.running()) {
      this.stopTimer();
      return;
    }
    this.baseline = this.seconds() ?? 0;
    this.startedAt = Date.now();
    this.running.set(true);
    this.timer = setInterval(() => {
      this.seconds.set(this.baseline + Math.floor((Date.now() - this.startedAt) / 1000));
    }, 250);
  }

  protected resetTimer(): void {
    this.stopTimer();
    this.seconds.set(null);
  }

  private stopTimer(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    this.running.set(false);
  }

  protected submit(): void {
    if (!this.canSave()) return;
    this.stopTimer();

    if (this.isCardio()) {
      // El servidor rechaza peso y reps en cardio; se envían explícitamente vacíos.
      this.save.emit({
        weight_kg: null,
        reps: null,
        duration_seconds: this.seconds(),
        intensity: this.intensity(),
        rpe: null,
        is_warmup: false,
      });
      return;
    }

    this.save.emit({
      weight_kg: this.toKg(this.weight()),
      reps: this.reps(),
      duration_seconds: this.seconds(),
      intensity: null,
      rpe: this.rpe(),
      is_warmup: this.warmup(),
    });
  }

  protected delete(): void {
    const id = this.set()?.id;
    if (id) this.remove.emit(id);
  }

  private toDisplay(kg: number | null): number | null {
    if (kg == null) return null;
    return this.unit() === 'lb' ? Math.round(kg * LB_PER_KG * 10) / 10 : kg;
  }

  private toKg(value: number | null): number | null {
    if (value == null) return null;
    return this.unit() === 'lb' ? Math.round((value / LB_PER_KG) * 100) / 100 : value;
  }
}
