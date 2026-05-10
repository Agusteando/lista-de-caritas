import type { Pool } from 'mysql2/promise'
import { normalizeAttendanceDate } from './dates'
import { loadLegacyPlantelStudents, type LegacyStudent } from './legacyRoster'
import { tableExists, normalizeStudentName } from './attendanceSources'

export interface RetardoRecord {
  studentId: string
  nombre: string
  matricula?: string | null
  date: string
  time: string
  recordId: string
}

interface AccessRow {
  record_id: string | number
  student_fullname: string
  matricula: string | null
  date: string
  time: string
}

function thresholdForPlantel(plantel: string) {
  if (plantel === 'PM' || plantel === 'PT') return '08:01:00'
  if (plantel === 'SM' || plantel === 'ST') return '07:01:00'
  return '09:01:00'
}

function rosterIndexes(students: LegacyStudent[]) {
  const byMatricula = new Map<string, LegacyStudent>()
  const byName = new Map<string, LegacyStudent>()
  for (const student of students) {
    if (student.matricula) byMatricula.set(String(student.matricula).trim(), student)
    byName.set(normalizeStudentName(student.nombre), student)
  }
  return { byMatricula, byName }
}

async function hasRetardoTables(pool: Pool) {
  const [acceso, alumnoPa, users] = await Promise.all([
    tableExists(pool, 'acceso'),
    tableExists(pool, 'alumno_pa'),
    tableExists(pool, 'users')
  ])
  return acceso && alumnoPa && users
}

export async function readRetardosForGroup(pool: Pool, params: { plantel: string; grado: string; grupo: string; date?: unknown }) {
  const attendanceDate = normalizeAttendanceDate(params.date)
  const threshold = thresholdForPlantel(params.plantel)

  if (!(await hasRetardoTables(pool))) {
    return { available: false, threshold, attendanceDate, records: [] as RetardoRecord[] }
  }

  const students = (await loadLegacyPlantelStudents(params.plantel, { includePhotos: false }))
    .filter((student) => student.grado === params.grado && student.grupo === params.grupo)
  const { byMatricula, byName } = rosterIndexes(students)

  if (!students.length) return { available: true, threshold, attendanceDate, records: [] as RetardoRecord[] }

  const [rows] = await pool.execute(
    `SELECT
        A.id AS record_id,
        TRIM(CONCAT(IFNULL(ap.nombreA,''), ' ', IFNULL(ap.paternoA,''), ' ', IFNULL(ap.maternoA,''))) AS student_fullname,
        B.username AS matricula,
        DATE_FORMAT(A.timestamp, '%Y-%m-%d') AS date,
        TIME_FORMAT(A.timestamp, '%H:%i:%s') AS time
      FROM acceso A
      JOIN alumno_pa ap ON ap.user_id = A.ss_id
      JOIN users B ON ap.user_id = B.id
      WHERE B.plantel LIKE CONCAT(:plantel, '%')
        AND A.type = 'entrada'
        AND COALESCE(A.suspension_efectiva, 0) = 0
        AND DAYOFWEEK(A.timestamp) NOT IN (1, 7)
        AND DATE(A.timestamp) = :attendanceDate
        AND TIME(A.timestamp) > :threshold
      ORDER BY A.timestamp ASC`,
    { plantel: params.plantel, attendanceDate, threshold }
  ) as unknown as [AccessRow[], unknown]

  const byStudent = new Map<string, RetardoRecord>()
  for (const row of rows) {
    const matricula = String(row.matricula || '').trim()
    const matched = (matricula && byMatricula.get(matricula)) || byName.get(normalizeStudentName(row.student_fullname))
    if (!matched) continue
    if (byStudent.has(matched.id)) continue
    byStudent.set(matched.id, {
      studentId: matched.id,
      nombre: matched.nombre,
      matricula: matched.matricula,
      date: String(row.date).slice(0, 10),
      time: String(row.time).slice(0, 8),
      recordId: String(row.record_id)
    })
  }

  return { available: true, threshold, attendanceDate, records: [...byStudent.values()] }
}
