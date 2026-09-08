import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';
import { ToastService } from '../../services/toast.service';

type Mode = 'login' | 'signup';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  protected readonly sb = inject(SupabaseService);

  /** El alta de cuentas se controla desde environment.allowSignup. */
  protected readonly signupEnabled = environment.allowSignup;
  protected readonly mode = signal<Mode>('login');
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected email = '';
  protected password = '';
  protected name = '';

  protected setMode(mode: Mode): void {
    if (mode === 'signup' && !this.signupEnabled) return;
    this.mode.set(mode);
    this.error.set('');
  }

  protected async submit(): Promise<void> {
    if (this.busy()) return;
    this.error.set('');

    if (!this.email.trim() || this.password.length < 6) {
      this.error.set('Escribe tu email y una contraseña de al menos 6 caracteres');
      return;
    }

    this.busy.set(true);
    try {
      if (this.mode() === 'login' || !this.signupEnabled) {
        await this.auth.signIn(this.email.trim(), this.password);
      } else {
        const { needsConfirmation } = await this.auth.signUp(
          this.email.trim(),
          this.password,
          this.name.trim() || this.email.split('@')[0],
        );
        if (needsConfirmation) {
          this.toast.ok('Cuenta creada. Confirma el email para entrar.');
          this.setMode('login');
          return;
        }
      }
      await this.router.navigate(['/hoy']);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se ha podido completar');
    } finally {
      this.busy.set(false);
    }
  }

  protected async forgot(): Promise<void> {
    if (!this.email.trim()) {
      this.error.set('Escribe primero tu email');
      return;
    }
    try {
      await this.auth.resetPassword(this.email.trim());
      this.toast.ok('Te hemos enviado un enlace para restablecer la contraseña');
    } catch (e) {
      this.toast.error(e);
    }
  }
}
