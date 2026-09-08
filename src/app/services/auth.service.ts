import { computed, Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { Session, User } from '@supabase/supabase-js';
import { Profile } from '../models/db';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sb = inject(SupabaseService);
  private readonly router = inject(Router);

  private readonly _session = signal<Session | null>(null);
  private readonly _profile = signal<Profile | null>(null);
  /** false hasta que se resuelve la sesión persistida: evita parpadeos de login. */
  private readonly _ready = signal(false);

  readonly session = this._session.asReadonly();
  readonly profile = this._profile.asReadonly();
  readonly ready = this._ready.asReadonly();
  readonly user = computed<User | null>(() => this._session()?.user ?? null);
  readonly isLoggedIn = computed(() => !!this._session());
  readonly unit = computed(() => this._profile()?.unit ?? 'kg');
  readonly displayName = computed(
    () => this._profile()?.display_name || this.user()?.email?.split('@')[0] || 'Atleta',
  );

  constructor() {
    void this.restore();

    this.sb.client.auth.onAuthStateChange((_event, session) => {
      this._session.set(session);
      if (session) {
        void this.loadProfile();
      } else {
        this._profile.set(null);
      }
    });
  }

  private async restore(): Promise<void> {
    const { data } = await this.sb.client.auth.getSession();
    this._session.set(data.session);
    if (data.session) await this.loadProfile();
    this._ready.set(true);
  }

  /** Espera a que la sesión persistida esté resuelta (lo usan los guards). */
  async whenReady(): Promise<void> {
    if (this._ready()) return;
    await new Promise<void>((resolve) => {
      const tick = () => (this._ready() ? resolve() : setTimeout(tick, 25));
      tick();
    });
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.sb.client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(this.sb.humanError(error));
  }

  async signUp(email: string, password: string, displayName: string): Promise<{ needsConfirmation: boolean }> {
    const { data, error } = await this.sb.client.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) throw new Error(this.sb.humanError(error));
    return { needsConfirmation: !data.session };
  }

  async resetPassword(email: string): Promise<void> {
    const { error } = await this.sb.client.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname,
    });
    if (error) throw new Error(this.sb.humanError(error));
  }

  async signOut(): Promise<void> {
    await this.sb.client.auth.signOut();
    this._session.set(null);
    this._profile.set(null);
    await this.router.navigate(['/entrar']);
  }

  async loadProfile(): Promise<void> {
    const uid = this.user()?.id;
    if (!uid) return;
    const { data } = await this.sb.client.from('profiles').select('*').eq('id', uid).maybeSingle();
    this._profile.set((data as Profile) ?? null);
  }

  async updateProfile(patch: Partial<Profile>): Promise<void> {
    const uid = this.user()?.id;
    if (!uid) return;
    const { data, error } = await this.sb.client
      .from('profiles')
      .update(patch)
      .eq('id', uid)
      .select()
      .single();
    if (error) throw new Error(this.sb.humanError(error));
    this._profile.set(data as Profile);
  }
}
