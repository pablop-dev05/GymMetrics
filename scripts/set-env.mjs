/**
 * Genera src/environments/environment.ts antes de compilar.
 *
 * El fichero no está en el repo (lleva la credencial), así que en CI hay que crearlo:
 *   - con SUPABASE_URL y SUPABASE_ANON_KEY definidas → se escribe con esos valores
 *   - sin ellas → se copia la plantilla, para que el build no reviente; la app
 *     arrancará avisando de que falta configurar Supabase
 *
 * ALLOW_SIGNUP=true reactiva el alta de cuentas desde la app (desactivada por defecto).
 */
import { access, copyFile, writeFile } from 'node:fs/promises';

const FILE = 'src/environments/environment.ts';
const TEMPLATE = 'src/environments/environment.example.ts';

const url = process.env['SUPABASE_URL'];
const key = process.env['SUPABASE_ANON_KEY'];
const allowSignup = process.env['ALLOW_SIGNUP'] === 'true';

const exists = await access(FILE).then(() => true, () => false);

if (!url || !key) {
  if (exists) {
    console.log('ℹ️  Sin variables de entorno; se conserva el environment.ts actual.');
  } else {
    await copyFile(TEMPLATE, FILE);
    console.warn('⚠️  SUPABASE_URL / SUPABASE_ANON_KEY sin definir: environment.ts creado desde la plantilla.');
  }
  process.exit(0);
}

await writeFile(
  FILE,
  `// Generado por scripts/set-env.mjs — no editar a mano.
export const environment = {
  production: true,
  supabaseUrl: '${url}',
  supabaseAnonKey: '${key}',
  allowSignup: ${allowSignup},
};
`,
);
console.log('✓ environment.ts generado para', new URL(url).host);
