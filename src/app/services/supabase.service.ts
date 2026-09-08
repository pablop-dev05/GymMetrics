import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

/**
 * Cliente único de Supabase. Cualquier otro servicio pide el cliente aquí,
 * nunca lo instancia por su cuenta (una sola sesión, un solo canal de auth).
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient;

  /** false si aún no se han rellenado las credenciales en environment.ts */
  readonly configured = !environment.supabaseUrl.startsWith('PON_AQUI');

  constructor() {
    this.client = createClient(
      this.configured ? environment.supabaseUrl : 'http://localhost:54321',
      this.configured ? environment.supabaseAnonKey : 'anon-key-no-configurada',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false, // login por email+contraseña: no hay callback en la URL
          storageKey: 'gymmetrics.auth',
        },
      },
    );
  }

  /** Traduce los errores de Supabase a mensajes en castellano. */
  humanError(error: unknown): string {
    const msg = (error as { message?: string })?.message ?? 'Error desconocido';
    const map: Record<string, string> = {
      'Invalid login credentials': 'Email o contraseña incorrectos',
      'Email not confirmed': 'Tienes que confirmar el email antes de entrar',
      'User already registered': 'Ya existe una cuenta con ese email',
      'Password should be at least 6 characters': 'La contraseña necesita al menos 6 caracteres',
      'Unable to validate email address: invalid format': 'El email no es válido',
      'Failed to fetch': 'Sin conexión con el servidor',
    };
    return map[msg] ?? msg;
  }
}
