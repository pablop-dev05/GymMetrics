/**
 * Plantilla de configuración. Cópiala a `environment.ts` y rellena tus valores:
 *
 *   cp src/environments/environment.example.ts src/environments/environment.ts
 *
 * `environment.ts` está en .gitignore: la credencial no se versiona. En CI la genera
 * `scripts/set-env.mjs` a partir de los secrets SUPABASE_URL y SUPABASE_ANON_KEY.
 */
export const environment = {
  production: false,
  supabaseUrl: 'PON_AQUI_TU_SUPABASE_URL',
  supabaseAnonKey: 'PON_AQUI_TU_SUPABASE_ANON_KEY',

  /** Alta de cuentas desde la app. Ahora mismo se crean desde el panel de Supabase. */
  allowSignup: false,
};
