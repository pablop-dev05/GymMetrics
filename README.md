# GymMetrics

App móvil (PWA) para registrar entrenos y ver métricas: series, pesos, tiempos y rutinas por día.
Angular 21 · Supabase · Chart.js · desplegada en GitHub Pages.

Estética **liquid glass** con tema fitness: fondo de luz en movimiento, paneles de cristal
con desenfoque y refracción de borde, acentos menta/violeta y navegación inferior flotante.
Diseñada mobile-first: carril de 520 px, áreas táctiles de 44-58 px y respeto de las
safe areas de iOS.

---

## Puesta en marcha

```bash
pnpm install
```

### 1. Supabase
Crear el proyecto, ejecutar los SQL de `supabase/migrations` y activar el login por
email + contraseña. Después, copia la plantilla y rellena tus credenciales:

```bash
cp src/environments/environment.example.ts src/environments/environment.ts
```

```ts
export const environment = {
  production: false,
  supabaseUrl: 'https://xxxx.supabase.co',
  supabaseAnonKey: 'sb_publishable_…',
  allowSignup: false,   // el alta de cuentas se hace desde el panel de Supabase
};
```

`environment.ts` está en `.gitignore`: la credencial no viaja al repo. En el build de
GitHub Pages la inyecta `scripts/set-env.mjs` desde los secrets.

### 2. En local
```bash
pnpm start        # http://localhost:4200
```

### 3. Publicar en GitHub Pages
1. Sube el repo a GitHub con el nombre **GymMetrics**.
2. *Settings → Pages → Source*: **GitHub Actions**.
3. *Settings → Secrets and variables → Actions → New repository secret*, añade:
   - `SUPABASE_URL` → `https://xxxx.supabase.co`
   - `SUPABASE_ANON_KEY` → tu publishable key

   No hace falta ninguna otra credencial: el despliegue usa el `GITHUB_TOKEN` que
   Actions genera solo, sin deploy keys ni tokens personales.
4. Push a `main`. El workflow [`deploy.yml`](.github/workflows/deploy.yml) compila con
   `--base-href /GymMetrics/`, genera el `404.html` para las rutas del router y publica.

Queda en `https://<usuario>.github.io/GymMetrics/`, instalable desde el navegador móvil
(«Añadir a pantalla de inicio»).

---

## Scripts

| Comando | Qué hace |
|---------|----------|
| `pnpm start` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm build:pages` | Build para GitHub Pages (base-href + 404.html) |
| `pnpm test` | Tests con Vitest |
| `pnpm icons` | Regenera los iconos PWA desde `scripts/make-icons.mjs` |

---

## Estructura

```
src/app/
├── component/            una carpeta por pantalla o modal
│   ├── shell/            layout con la barra de pestañas inferior
│   ├── login/            entrar y crear cuenta
│   ├── dashboard/        pantalla «Hoy»: métricas y gráficos del día
│   ├── workout/          pantalla «Entreno»: series, pesos y tiempos
│   ├── routines/         pantalla «Rutinas»: qué toca cada día
│   ├── routine-editor/   modal de alta/edición de rutina
│   ├── exercise-picker/  modal de selección de ejercicio
│   ├── set-editor/       modal de alta/edición de serie
│   ├── profile/          perfil, unidades y récords
│   ├── charts/           envoltorio de Chart.js y presets de gráficos
│   └── ui/               modal, toasts y estado vacío reutilizables
├── services/             Supabase, auth, ejercicios, entrenos, rutinas, métricas, toasts
├── guard/                authGuard (área privada) y guestGuard (login)
├── pipes/                weight, duration, muscle, weekday, smartDate
├── models/               tipos del esquema y metadatos de UI
└── styles/               tokens y primitivas de cristal (_tokens, _glass)
```

Las pantallas se cargan con `loadComponent`, así que cada una viaja en su propio chunk.

## Cómo funciona

- **El cardio se mide en tiempo e intensidad**, nunca en peso ni repeticiones, y sin
  calorías. La app trae cronómetro y una escala de cuatro niveles basada en la prueba
  del habla; el servidor lo hace cumplir con un trigger.
- **Pesos en kg siempre en base de datos.** La conversión a libras es de presentación
  (`WeightPipe` y el editor de series), según `profiles.unit`.
- **Las métricas se calculan en Postgres**, no en el cliente: las vistas `v_daily_summary`,
  `v_muscle_volume`, `v_exercise_progress` y `v_personal_records` llevan `security_invoker`,
  de modo que cada usuario sólo agrega sus propias filas.
- **El `user_id` de las filas hijas lo pone un trigger** a partir de su padre; el cliente
  nunca puede reasignar una serie a otro usuario.
- **Offline**: el service worker cachea la app y, con estrategia *freshness*, las últimas
  respuestas de la API REST de Supabase.
