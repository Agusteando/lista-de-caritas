# lista-de-caritas app

Single Nuxt 3 full-stack attendance and Logros app. It keeps the legacy teacher workflow—plantel, grado, grupo, student cards, attendance states, save, and summary—while redesigning the experience around a faster mobile-first journey.

The app is intentionally one deployable Nuxt/Nitro app. MySQL access, attendance writes, Logros writes, idempotency, and internal logging stay on the server side. There is no split frontend/backend app and no PWA layer.

## User journey

Teachers can start at `/` and choose their plantel from large selection cards. There is no default plantel.

After choosing a plantel, the teacher selects grado and grupo once. That context is stored locally on the device. The next time the same teacher opens the app, the landing page offers a one-tap continue card, and `/asistencia/:plantel` redirects straight to the remembered `/asistencia/:plantel/:grado/:grupo` route when possible. The attendance screen also exposes a deliberate `Cambiar grupo` path that returns to group selection without clearing the remembered context.

The attendance route renders cached roster data immediately when available, then refreshes the roster and today’s saved attendance in the background. The UI shows calm teacher-facing states such as “Preparando,” “Listo,” and “Pendiente de guardar.” Technical failures are logged internally and are not shown to teachers.

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
- “Marcar todos presentes” first, then exception handling.
- Fixed bottom save action.
- Teacher-safe save states.
- Summary sheet with subtle completion motion.
- Optional subtle sounds for status changes, save, completion, Logros, streaks, and milestones.
- Secondary Logros mode with fixed categories, points, streaks, badges, and weekly rankings.

## Install

```bash
npm install
cp .env.example .env
mysql -u root -p attendance_db < sql/schema.sql
npm run dev
```

For production on a physical server:

```bash
npm run build
node .output/server/index.mjs
```

Use systemd, PM2, or another process manager for the built Nitro server. Put Nginx, Caddy, or Apache in front of it for TLS and reverse proxying.

## Environment

Two database connections are supported because production keeps student-photo data and attendance data in different databases. Copy `.env.example` to `.env` and set both groups.

```txt
# Attendance database: legacy asistencia + app-owned attendance/logros/internal tables
ATTENDANCE_MYSQL_HOST=127.0.0.1
ATTENDANCE_MYSQL_PORT=3306
ATTENDANCE_MYSQL_USER=attendance_user
ATTENDANCE_MYSQL_PASSWORD=change-me
ATTENDANCE_MYSQL_DATABASE=attendance_db

# Matricula database: matricula(matricula, foto), and optionally acceso/alumno_pa/users for Retardos
MATRICULA_MYSQL_HOST=127.0.0.1
MATRICULA_MYSQL_PORT=3306
MATRICULA_MYSQL_USER=matricula_user
MATRICULA_MYSQL_PASSWORD=change-me
MATRICULA_MYSQL_DATABASE=matricula_db
```

The older `MYSQL_*` variables still work as a fallback for the attendance connection. If `MATRICULA_MYSQL_*` is omitted, the matricula lookup falls back to the attendance connection.

## Database

The runtime auto-heals the app-owned schema on the attendance connection on server start and before DB-backed routes. `sql/schema.sql` is still included for explicit installs or audits. The schema creates only app-owned write/log tables:

- `attendance_operations`
- `attendance_records`
- `logro_operations`
- `logro_events`
- `internal_logs`

Attendance uses a unique key on plantel/grado/grupo/student/day so repeated submissions update the same day record. `attendance_operations` stores idempotency state by `operationId`.

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
- `server/api/asistencia.post.ts` for idempotent attendance writes.
- `server/api/logros.post.ts` and `server/api/planteles/[plantel]/grupos/[grado]/[grupo]/logros-estado.get.ts` for Logros writes and real DB-backed state.
- `server/utils/db.ts` for the separate attendance and matricula DB pools.
- `server/utils/schema.ts` for runtime schema auto-healing on the attendance DB.
- `assets/css/main.css` for the visual system.

## Validation status

This is a complete project scaffold with production-oriented routes, state flow, UI, and schema. It has not run against your production database in this environment. Smoke-test all six planteles from physical devices before replacing the legacy system.

## Client-side Vision photo pipeline

Student cards render the roster photo immediately. When a real `matricula.foto` URL exists, the client starts a background Vision pass using `utils/processFaceImage.js`. The UI keeps the original image visible while processing, stores the processed transparent PNG in localStorage, and uses the cached processed image on later visits. Missing or failing images fall back to the legacy external placeholder.

Core files:

- `utils/processFaceImage.js` — framework-agnostic Vanilla JS Vision/canvas pipeline.
- `composables/useProcessedStudentPhoto.ts` — Nuxt/Vue wrapper with non-blocking background processing and cache.
- `components/ProcessedStudentPhoto.vue` — reusable UI image component with raw-image fallback.
