import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PersonalRecord, WeightUnit } from '../../models/db';
import { AuthService } from '../../services/auth.service';
import { MetricsService } from '../../services/metrics.service';
import { ToastService } from '../../services/toast.service';
import { MusclePipe } from '../../pipes/muscle.pipe';
import { SmartDatePipe } from '../../pipes/smart-date.pipe';
import { WeightPipe } from '../../pipes/weight.pipe';

/** Perfil: datos del usuario, unidades, récords y cierre de sesión. */
@Component({
  selector: 'app-profile',
  imports: [FormsModule, MusclePipe, SmartDatePipe, WeightPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  private readonly metrics = inject(MetricsService);
  private readonly toast = inject(ToastService);
  protected readonly auth = inject(AuthService);

  protected readonly records = signal<PersonalRecord[]>([]);
  protected readonly saving = signal(false);
  protected readonly initials = computed(() =>
    this.auth.displayName().slice(0, 2).toUpperCase(),
  );

  protected name = '';
  protected goal = 4;

  constructor() {
    const p = this.auth.profile();
    this.name = p?.display_name ?? '';
    this.goal = p?.weekly_goal ?? 4;
    void this.metrics.personalRecords().then((r) => this.records.set(r));
  }

  protected async setUnit(unit: WeightUnit): Promise<void> {
    try {
      await this.auth.updateProfile({ unit });
      this.toast.ok(`Unidad cambiada a ${unit}`);
    } catch (e) {
      this.toast.error(e);
    }
  }

  protected async save(): Promise<void> {
    this.saving.set(true);
    try {
      await this.auth.updateProfile({
        display_name: this.name.trim(),
        weekly_goal: Number(this.goal) || 0,
      });
      this.toast.ok('Perfil actualizado');
    } catch (e) {
      this.toast.error(e);
    } finally {
      this.saving.set(false);
    }
  }

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
  }
}
