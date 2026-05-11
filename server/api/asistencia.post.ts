import { createError, readBody } from 'h3'
import type { ResultSetHeader } from 'mysql2/promise'
import { allowedPlantel, normalizeGrade, normalizeGroup, normalizePlantel } from '../utils/constants'
import { withTransaction } from '../utils/db'
import { logTechnicalFailure } from '../utils/logger'
import { normalizeAttendanceDate } from '../utils/dates'
import { assertStatus, legacyFromStatus } from '../utils/validation'

interface BodyRecord {
  studentId?: string
  nombre?: string
  status?: unknown
}

interface AttendanceBody {
  operationId?: string
  plantel?: string
  grado?: string
  grupo?: string
  submittedAt?: string
  attendanceDate?: string
  records?: BodyRecord[]
  clientSummary?: unknown
}

function mysqlDateTimeForAttendanceDate(attendanceDate: string) {
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return `${attendanceDate} ${hh}:${mm}:${ss}`
}

export default defineEventHandler(async (event) => {
  const body = await readBody<AttendanceBody>(event)
  const operationId = String(body.operationId || '').trim()
  const plantel = normalizePlantel(body.plantel)
  const grado = normalizeGrade(body.grado)
  const grupo = normalizeGroup(body.grupo)
  const attendanceDate = normalizeAttendanceDate(body.attendanceDate || body.submittedAt)
  const fecha = mysqlDateTimeForAttendanceDate(attendanceDate)

  try {
    if (!operationId || operationId.length > 120) throw createError({ statusCode: 400, statusMessage: 'Operación no válida' })
    if (!allowedPlantel(plantel) || !grado || !grupo) throw createError({ statusCode: 400, statusMessage: 'Contexto no válido' })
    if (!Array.isArray(body.records)) throw createError({ statusCode: 400, statusMessage: 'Lista no válida' })

    const records = body.records.map((record) => {
      const status = assertStatus(record.status)
      const legacy = legacyFromStatus(status)
      return {
        nombre: String(record.nombre || '').trim(),
        status,
        modalidad: legacy.modalidad,
        attendance: legacy.attendance
      }
    }).filter((record) => record.nombre && record.status !== 'unmarked')

    const result = await withTransaction(async (connection) => {
      for (const record of records) {
        const [updateResult] = await connection.execute<ResultSetHeader>(
          `UPDATE asistencia
           SET attendance = :attendance,
               modalidad = :modalidad,
               fecha = STR_TO_DATE(:fecha, '%Y-%m-%d %H:%i:%s')
           WHERE plantel = :plantel
             AND LOWER(TRIM(grado)) = :grado
             AND UPPER(TRIM(grupo)) = :grupo
             AND name = :nombre
             AND fecha >= STR_TO_DATE(:attendanceDate, '%Y-%m-%d')
             AND fecha < DATE_ADD(STR_TO_DATE(:attendanceDate, '%Y-%m-%d'), INTERVAL 1 DAY)`,
          { plantel, grado, grupo, nombre: record.nombre, attendance: record.attendance, modalidad: record.modalidad, attendanceDate, fecha }
        )

        if (Number(updateResult.affectedRows || 0) === 0) {
          await connection.execute<ResultSetHeader>(
            `INSERT INTO asistencia
               (name, attendance, grado, grupo, modalidad, plantel, fecha)
             VALUES
               (:nombre, :attendance, :grado, :grupo, :modalidad, :plantel, STR_TO_DATE(:fecha, '%Y-%m-%d %H:%i:%s'))`,
            { plantel, grado, grupo, nombre: record.nombre, attendance: record.attendance, modalidad: record.modalidad, fecha }
          )
        }
      }

      return {
        ok: true,
        operationId,
        plantel,
        grado,
        grupo,
        savedAt: new Date().toISOString(),
        attendanceDate,
        summary: {
          total: records.length,
          presentes: records.filter((record) => record.status === 'present').length,
          faltas: records.filter((record) => record.status === 'absent').length,
          enfermedad: records.filter((record) => record.status === 'sick').length,
          sinMarcar: Array.isArray(body.records) ? body.records.length - records.length : 0
        }
      }
    })

    return result
  } catch (err) {
    await logTechnicalFailure(event, {
      endpoint: 'POST /api/asistencia',
      operationId,
      plantel,
      grado,
      grupo,
      payloadSummary: {
        attendanceDate,
        records: Array.isArray(body.records) ? body.records.length : 0,
        clientSummary: body.clientSummary
      },
      failureReason: err instanceof Error ? err.stack || err.message : String(err),
      retryStatus: 'client_will_retry_same_daily_rows'
    })
    throw createError({ statusCode: 503, statusMessage: 'No disponible' })
  }
})
