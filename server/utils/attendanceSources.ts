import dayjs from 'dayjs'
import type { Pool } from 'mysql2/promise'
import { weekBoundsForAttendanceDate } from './dates'

export type PortableAttendanceStatus = 'present' | 'absent' | 'sick' | 'unmarked'

interface AttendanceSourceRow {
  source: 'app' | 'legacy'
  date: string
  studentId: string | null
  nombre: string
  attendance: number | string | null
  modalidad: number | string | null
  status?: PortableAttendanceStatus | null
  updatedAt?: string | null
}

export interface DailyAttendanceRecord {
  studentId?: string
  nombre: string
  status: PortableAttendanceStatus
  attendance: 0 | 1
  modalidad: '0' | '1' | '2' | '9'
  source: 'app' | 'legacy'
}

export interface WeeklyAttendanceDaySummary {
  date: string
  label: string
  shortLabel: string
  presentes: number
  faltas: number
  enfermedad: number
  total: number
  isToday: boolean
}

const dayLabels = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']

export function normalizeStudentName(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export async function tableExists(pool: Pool, tableName: string) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?`,
    [tableName]
  ) as unknown as [Array<{ total: number | string }>, unknown]
  return Number(rows[0]?.total || 0) > 0
}

function normalizeModalidad(value: unknown): '0' | '1' | '2' | '9' {
  const raw = String(value ?? '').trim()
  if (raw === '1') return '1'
  if (raw === '2') return '2'
  if (raw === '9') return '9'
  return '0'
}

function statusFromLegacyFields(row: Pick<AttendanceSourceRow, 'attendance' | 'modalidad' | 'status'>) {
  const modalidad = normalizeModalidad(row.modalidad)
  const attendance = Number(row.attendance ?? 0)

  if (modalidad === '2') return { status: 'sick' as const, modalidad, attendance: 0 as const }
  if (attendance === 1) return { status: 'present' as const, modalidad: modalidad === '9' ? '1' as const : modalidad, attendance: 1 as const }
  if (modalidad === '9' || row.status === 'unmarked') return { status: 'unmarked' as const, modalidad: '9' as const, attendance: 0 as const }
  return { status: 'absent' as const, modalidad: '0' as const, attendance: 0 as const }
}

function dedupeAttendanceRows(rows: AttendanceSourceRow[]) {
  const ordered = [...rows].sort((a, b) => {
    if (a.source === b.source) return String(a.updatedAt || '').localeCompare(String(b.updatedAt || ''))
    return a.source === 'legacy' ? -1 : 1
  })

  const byStudentDay = new Map<string, AttendanceSourceRow>()
  for (const row of ordered) {
    const nameKey = normalizeStudentName(row.nombre)
    const studentKey = nameKey || String(row.studentId || '').trim()
    if (!row.date || !studentKey) continue
    byStudentDay.set(`${row.date}:${studentKey}`, row)
  }

  return [...byStudentDay.values()]
}

async function readAppAttendanceRows(pool: Pool, params: { plantel: string; grado: string; grupo: string; startDate: string; endDate: string }) {
  if (!(await tableExists(pool, 'attendance_records'))) return []

  try {
    const [rows] = await pool.execute(
      `SELECT
          'app' AS source,
          DATE_FORMAT(attendance_date, '%Y-%m-%d') AS date,
          student_id AS studentId,
          nombre,
          attendance,
          modalidad,
          status,
          DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updatedAt
        FROM attendance_records
        WHERE plantel = :plantel
          AND grado = :grado
          AND grupo = :grupo
          AND attendance_date >= STR_TO_DATE(:startDate, '%Y-%m-%d')
          AND attendance_date <= STR_TO_DATE(:endDate, '%Y-%m-%d')`,
      params
    ) as unknown as [AttendanceSourceRow[], unknown]
    return rows
  } catch {
    return []
  }
}

async function readLegacyAttendanceRows(pool: Pool, params: { plantel: string; grado: string; grupo: string; startDate: string; endDate: string }) {
  if (!(await tableExists(pool, 'asistencia'))) return []

  try {
    const [rows] = await pool.execute(
      `SELECT
          'legacy' AS source,
          DATE_FORMAT(fecha, '%Y-%m-%d') AS date,
          NULL AS studentId,
          name AS nombre,
          attendance,
          modalidad,
          NULL AS status,
          DATE_FORMAT(fecha, '%Y-%m-%d %H:%i:%s') AS updatedAt
        FROM asistencia
        WHERE plantel = :plantel
          AND LOWER(TRIM(grado)) = :grado
          AND UPPER(TRIM(grupo)) = :grupo
          AND fecha >= STR_TO_DATE(:startDate, '%Y-%m-%d')
          AND fecha < DATE_ADD(STR_TO_DATE(:endDate, '%Y-%m-%d'), INTERVAL 1 DAY)`,
      params
    ) as unknown as [AttendanceSourceRow[], unknown]
    return rows
  } catch {
    return []
  }
}

export async function readPortableAttendanceRows(pool: Pool, params: { plantel: string; grado: string; grupo: string; startDate: string; endDate: string }) {
  const [appRows, legacyRows] = await Promise.all([
    readAppAttendanceRows(pool, params),
    readLegacyAttendanceRows(pool, params)
  ])
  return dedupeAttendanceRows([...legacyRows, ...appRows])
}

export async function readDailyAttendance(pool: Pool, params: { plantel: string; grado: string; grupo: string; attendanceDate: string }) {
  const rows = await readPortableAttendanceRows(pool, {
    plantel: params.plantel,
    grado: params.grado,
    grupo: params.grupo,
    startDate: params.attendanceDate,
    endDate: params.attendanceDate
  })

  return rows.map((row) => {
    const normalized = statusFromLegacyFields(row)
    return {
      studentId: row.studentId || undefined,
      nombre: row.nombre,
      source: row.source,
      ...normalized
    } satisfies DailyAttendanceRecord
  }).filter((record) => record.nombre || record.studentId)
}

export async function summarizeWeeklyAttendance(pool: Pool, params: { plantel: string; grado: string; grupo: string; date?: unknown }) {
  const { attendanceDate, weekStart, weekEnd } = weekBoundsForAttendanceDate(params.date)
  const rows = await readPortableAttendanceRows(pool, {
    plantel: params.plantel,
    grado: params.grado,
    grupo: params.grupo,
    startDate: weekStart.format('YYYY-MM-DD'),
    endDate: weekEnd.format('YYYY-MM-DD')
  })

  const byDate = new Map<string, { presentes: number; faltas: number; enfermedad: number; total: number }>()
  for (const row of rows) {
    const normalized = statusFromLegacyFields(row)
    if (normalized.status === 'unmarked') continue
    const current = byDate.get(row.date) || { presentes: 0, faltas: 0, enfermedad: 0, total: 0 }
    if (normalized.status === 'present') current.presentes += 1
    if (normalized.status === 'absent') current.faltas += 1
    if (normalized.status === 'sick') current.enfermedad += 1
    current.total += 1
    byDate.set(row.date, current)
  }

  const selectedDay = dayjs(attendanceDate)
  const days: WeeklyAttendanceDaySummary[] = Array.from({ length: 5 }, (_, index) => {
    const date = weekStart.add(index, 'day')
    const key = date.format('YYYY-MM-DD')
    const counts = byDate.get(key) || { presentes: 0, faltas: 0, enfermedad: 0, total: 0 }
    return {
      date: key,
      label: dayLabels[date.day()],
      shortLabel: date.format('D'),
      ...counts,
      isToday: date.isSame(selectedDay, 'day')
    }
  })

  const streakStart = weekStart.subtract(12, 'week').format('YYYY-MM-DD')
  const streakRows = await readPortableAttendanceRows(pool, {
    plantel: params.plantel,
    grado: params.grado,
    grupo: params.grupo,
    startDate: streakStart,
    endDate: attendanceDate
  })

  const weeks = new Map<string, { presentes: number; faltas: number; marked: number }>()
  for (const row of streakRows) {
    const normalized = statusFromLegacyFields(row)
    if (normalized.status === 'unmarked') continue
    const monday = dayjs(row.date).subtract((dayjs(row.date).day() + 6) % 7, 'day').format('YYYY-MM-DD')
    const current = weeks.get(monday) || { presentes: 0, faltas: 0, marked: 0 }
    if (normalized.status === 'present') current.presentes += 1
    if (normalized.status === 'absent') current.faltas += 1
    if (normalized.status === 'sick') current.marked += 1
    else current.marked += 1
    weeks.set(monday, current)
  }

  let positiveWeekStreak = 0
  for (const [weekKey, counts] of [...weeks.entries()].sort((a, b) => b[0].localeCompare(a[0]))) {
    if (weekKey > weekStart.format('YYYY-MM-DD')) continue
    if (counts.marked > 0 && counts.presentes > counts.faltas) positiveWeekStreak += 1
    else break
  }

  return {
    attendanceDate,
    weekStart: weekStart.format('YYYY-MM-DD'),
    weekEnd: weekEnd.format('YYYY-MM-DD'),
    days,
    positiveWeekStreak,
    hasAnyAttendanceData: days.some((day) => day.total > 0)
  }
}
