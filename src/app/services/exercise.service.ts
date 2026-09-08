import { computed, Injectable, inject, signal } from '@angular/core';
import { Exercise, MuscleGroup } from '../models/db';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

/**
 * Catálogo de ejercicios: los globales (user_id null) y los que crea el usuario.
 * Se cachea en memoria porque cambia poco y se consulta en casi todas las pantallas.
 */
@Injectable({ providedIn: 'root' })
export class ExerciseService {
  private readonly sb = inject(SupabaseService);
  private readonly auth = inject(AuthService);

  private readonly _all = signal<Exercise[]>([]);
  private readonly _loading = signal(false);
  private loaded = false;

  readonly all = this._all.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly byId = computed(() => new Map(this._all().map((e) => [e.id, e])));

  async load(force = false): Promise<Exercise[]> {
    if (this.loaded && !force) return this._all();
    this._loading.set(true);
    try {
      const { data, error } = await this.sb.client
        .from('exercises')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw new Error(this.sb.humanError(error));
      this._all.set((data ?? []) as Exercise[]);
      this.loaded = true;
      return this._all();
    } finally {
      this._loading.set(false);
    }
  }

  /** Filtro combinado por texto y grupo muscular, usado por el selector de ejercicios. */
  search(term: string, muscle: MuscleGroup | 'todos'): Exercise[] {
    const q = term.trim().toLowerCase();
    return this._all().filter((e) => {
      const okMuscle = muscle === 'todos' || e.muscle_group === muscle;
      const okTerm = !q || e.name.toLowerCase().includes(q);
      return okMuscle && okTerm;
    });
  }

  async create(input: {
    name: string;
    muscle_group: MuscleGroup;
    equipment: Exercise['equipment'];
    kind: Exercise['kind'];
  }): Promise<Exercise> {
    const uid = this.auth.user()?.id;
    // El cardio se registra solo con tiempo e intensidad: ni peso, ni reps, ni distancia.
    const tracks = {
      tracks_weight: input.kind !== 'cardio',
      tracks_reps: input.kind === 'fuerza',
      tracks_duration: input.kind !== 'fuerza',
      tracks_distance: false,
    };
    const { data, error } = await this.sb.client
      .from('exercises')
      .insert({ ...input, ...tracks, user_id: uid })
      .select()
      .single();
    if (error) throw new Error(this.sb.humanError(error));
    const created = data as Exercise;
    this._all.update((list) => [...list, created].sort((a, b) => a.name.localeCompare(b.name)));
    return created;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.sb.client.from('exercises').delete().eq('id', id);
    if (error) throw new Error(this.sb.humanError(error));
    this._all.update((list) => list.filter((e) => e.id !== id));
  }
}
