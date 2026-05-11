# lista-de-caritas app

Single Nuxt 3 full-stack attendance and Logros app. It keeps the legacy teacher workflow—plantel, grado, grupo, student cards, attendance states, save, and summary—while redesigning the experience around a faster mobile-first journey.

The app is intentionally one deployable Nuxt/Nitro app. MySQL access, attendance writes, Logros writes, and internal logging stay on the server side. There is no split frontend/backend app and no PWA layer.

## User journey

Teachers can start at `/` and choose their plantel from large selection cards. There is no default plantel.

After choosing a plantel, the teacher selects grado and grupo once. That context is stored locally on the device. The next time the same teacher opens the app, the landing page offers a one-tap continue card, and `/asistencia/:plantel` redirects straight to the remembered `/asistencia/:plantel/:grado/:grupo` route when possible. The attendance screen also exposes a deliberate `Cambiar grupo` path that returns to group selection without clearing the remembered context.

The attendance route renders cached roster data immediately when available, then refreshes the roster and today’s saved attendance in the background. The UI shows calm teacher-facing states such as “Guardando,” “Guardado,” and “Pendiente de guardar.” Technical failures are logged internally and are not shown to teachers.

## Routes

Teacher routes:

```txt
/
/asistencia/:plantel
/asistencia/:plantel/:grado/:grupo
```

Server routes:

```txt
GET  /api/planteles/:plantel/bootstrap
GET  /api/planteles/:plantel/grupos/:grado/:grupo/roster
GET  /api/planteles/:plantel/grupos/:grado/:grupo/asistencia-hoy
GET  /api/planteles/:plantel/grupos/:grado/:grupo/resumen-semanal
GET  /api/planteles/:plantel/grupos/:grado/:grupo/logros-resumen
GET  /api/planteles/:plantel/grupos/:grado/:grupo/logros-estado
GET  /api/planteles/:plantel/grupos/:grado/:grupo/retardos
POST /api/asistencia
POST /api/logros
```

## Roster source

`server/utils/legacyRoster.ts` is modeled directly on the supplied legacy `fetch-base-simple` handler. It calls the existing Google Apps Script URL from the server, reads the selected plantel payload, normalizes grado/grupo/name, skips bajas, and optionally looks up photos from the existing `matricula` table through the `MATRICULA_MYSQL_*` connection.

There is no sheet-id setting, source-mode switch, signed-link secret, or default plantel.

Valid planteles:

```txt
PM, PT, SM, ST, PREEM, PREET
```

Photo handling is intentionally external-host-first. Values from `matricula.foto` are treated as full external URLs when already absolute. Relative or bare stored values are resolved under `https://casitaiedis.edu.mx/virtual/`, matching the production photo shape such as `https://casitaiedis.edu.mx/virtual/68c5e1f233567.jpg`. Missing photos use the same external fallback image from the legacy code:

```txt
https://wweb.casitaapps.com/files/1724624551591-file.jpeg
```

## Included UX behavior

- Plantel selection cards on the landing page.
- No default plantel.
- Remembered plantel/grado/grupo per device.
- Clear return path from attendance back to group selection.
- Immediate cached roster render when available.
- Visible skeleton cards and calm sync strips while data prepares.
- Background roster refresh and silent merge.
- Attendance Mode as the default and dominant mode.
- Large student photo cards with fast status buttons.
- “Marcar todos presentes” plus direct per-student status cycling.
- Fixed bottom save action.
- Teacher-safe save states.
- Summary sheet with subtle completion motion.
- Optional subtle sounds for status changes, save, completion, Logros, streaks, and milestones.
- Secondary Logros mode with fixed categories, points, streaks, badges, and weekly rankings.

## Install

```bash
npm install
cp .env.example .env
npm run dev
```

For production on a physical server:

```bash
npm run build
node .output/server/index.mjs
```

Use systemd, PM2, or another process manager for the built Nitro server. Put Nginx, Caddy, or Apache in front of it for TLS and reverse proxying.

## Environment

Use two explicit database connections. Legacy attendance data lives in the `ATTENDANCE_MYSQL_*` database and is read/written through the existing `asistencia` table. Student photos and Retardos support tables use `MATRICULA_MYSQL_*`.

```txt
ATTENDANCE_MYSQL_HOST=127.0.0.1
ATTENDANCE_MYSQL_PORT=3306
ATTENDANCE_MYSQL_USER=
ATTENDANCE_MYSQL_PASSWORD=
ATTENDANCE_MYSQL_DATABASE=

MATRICULA_MYSQL_HOST=127.0.0.1
MATRICULA_MYSQL_PORT=3306
MATRICULA_MYSQL_USER=
MATRICULA_MYSQL_PASSWORD=
MATRICULA_MYSQL_DATABASE=
```

## Database

Attendance is deterministic and uses the existing legacy table only:

- `asistencia`

The app does not create, alter, repair, or backfill attendance tables. `Resumen semanal`, `asistencia-hoy`, attendance streaks, and attendance saves all use `asistencia` directly. Saves update an existing row for the same plantel/grado/grupo/student/date when present, otherwise they insert one legacy-compatible row.

Logros requires two app-owned tables in the `ATTENDANCE_MYSQL_*` database:

- `logro_operations` for idempotent Logros writes.
- `logro_events` for the awarded Logros history.

The app does not create, alter, repair, or backfill these tables at runtime. Run `sql/schema.sql` manually before enabling Logros.

## Logros rules

Categories:

- Participación
- Esfuerzo
- Ayuda a compañeros
- Puntualidad
- Buena actitud
- Trabajo completo
- Lectura
- Liderazgo

Point values:

- Normal Logro: +1
- Featured Logro of the day: +2
- Streak continuation: +1 bonus
- Weekly milestone: +3 bonus

Badge levels:

- Bronce: 5 category points
- Plata: 10 category points
- Oro: 20 category points
- Diamante: 40 category points

Weekly ranking types:

- Top Logros de la semana
- Mejor racha activa
- Más participativo
- Mejor actitud
- Mayor avance

## No PWA


## Files to inspect first

- `pages/index.vue` for plantel selection and continue behavior.
- `pages/asistencia/[plantel]/index.vue` for remembered group handoff.
- `pages/asistencia/[plantel]/[grado]/[grupo].vue` for the main teacher journey.
- `components/StudentAttendanceCard.vue` for external student photos and attendance card behavior.
- `server/utils/legacyRoster.ts` for the simplified legacy roster source and matricula-photo DB lookup.
- `server/api/asistencia.post.ts` for deterministic writes to the existing `asistencia` table.
- `server/api/logros.post.ts` and `server/api/planteles/[plantel]/grupos/[grado]/[grupo]/logros-estado.get.ts` for Logros writes and real DB-backed state.
- `server/utils/db.ts` for the separate attendance and matricula DB pools.
- `sql/schema.sql` for the manual Logros table creation SQL.
- `assets/css/main.css` for the visual system.


## Presentation architecture

The attendance route is kept as orchestration only. Page-level state, fetch orchestration, draft persistence, weekly projection, save flow, and Logros refresh behavior live in `composables/useAttendanceScreen.ts`. Pure display mapping and formatting live in `utils/attendanceDisplay.ts`.

Attendance styling is split by responsibility under `assets/css/features/attendance/`: layout, hero, metrics, controls, roster, save actions, sidebar, overlays, and responsive contracts. The desktop density uses fluid component tokens rather than one-off breakpoint patches so the workspace, rail, and roster cards scale against the available viewport.

## Validation status

This project was refactored for presentation architecture and density without changing API routes, data bindings, workflows, permissions, validations, or save behavior. Build validation could not be completed in this environment because dependency installation was unavailable/offline. It has not run against your production database here. Smoke-test all six planteles from physical devices before replacing the legacy system.

## Client-side Vision photo pipeline

Student cards render the roster photo immediately. When a real `matricula.foto` URL exists, the client starts a background Vision pass using `utils/processFaceImage.js`. The UI keeps the original image visible while processing, stores the processed transparent PNG in localStorage, and uses the cached processed image on later visits. Missing or failing images fall back to the legacy external placeholder.

Core files:

- `utils/processFaceImage.js` — framework-agnostic Vanilla JS Vision/canvas pipeline.
- `composables/useProcessedStudentPhoto.ts` — Nuxt/Vue wrapper with non-blocking background processing and cache.
- `components/ProcessedStudentPhoto.vue` — reusable UI image component with raw-image fallback.
