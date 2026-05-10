import { createError, readBody } from 'h3'
import type { ResultSetHeader } from 'mysql2/promise'
import { allowedPlantel, normalizeGrade, normalizeGroup, normalizePlantel } from '../utils/constants'
import { withTransaction } from '../utils/db'
import { stableHash } from '../utils/hash'
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

export default defineEventHandler(async (event) => {
  const body = await readBody<AttendanceBody>(event)
  const operationId = String(body.operationId || '').trim()
  const plantel = normalizePlantel(body.plantel)
  const grado = normalizeGrade(body.grado)
  const grupo = normalizeGroup(body.grupo)
  const attendanceDate = normalizeAttendanceDate(body.attendanceDate || body.submittedAt)

  try {
    if (!operationId || operationId.length > 120) throw createError({ statusCode: 400, statusMessage: 'Operación no válida' })
    if (!allowedPlantel(plantel) || !grado || !grupo) throw createError({ statusCode: 400, statusMessage: 'Contexto no válido' })
    if (!Array.isArray(body.records)) throw createError({ statusCode: 400, statusMessage: 'Lista no válida' })

    const records = body.records.map((record) => {
      const status = assertStatus(record.status)
      const legacy = legacyFromStatus(status)
      return {
        studentId: String(record.studentId || '').trim(),
        nombre: String(record.nombre || '').trim(),
        status,
        modalidad: legacy.modalidad,
        attendance: legacy.attendance
      }
    }).filter((record) => record.studentId && record.nombre)

    const payloadHash = stableHash({ plantel, grado, grupo, attendanceDate, records })

    const result = await withTransaction(async (connection) => {
      const [existingRows] = await connection.execute(
        'SELECT operation_id, status, payload_hash, result_json FROM attendance_operations WHERE operation_id = :operationId FOR UPDATE',
        { operationId }
      ) as unknown as [Array<{ operation_id: string; status: string; payload_hash: string; result_json: string | null }>, unknown]

      const existing = existingRows[0]
      if (existing?.status === 'success') {
        return existing.result_json ? JSON.parse(existing.result_json) : { ok: true, idempotent: true }
      }

      if (!existing) {
        await connection.execute(
          `INSERT INTO attendance_operations
             (operation_id, operation_type, plantel, grado, grupo, status, payload_hash, created_at, updated_at)
           VALUES (:operationId, 'attendance_save', :plantel, :grado, :grupo, 'pending', :payloadHash, NOW(), NOW())`,
          { operationId, plantel, grado, grupo, payloadHash }
        )
      }

      for (const record of records) {
        await connection.execute<ResultSetHeader>(
          `INSERT INTO attendance_records
             (operation_id, plantel, grado, grupo, student_id, nombre, attendance_date, status, modalidad, attendance, created_at, updated_at)
           VALUES
             (:operationId, :plantel, :grado, :grupo, :studentId, :nombre, :attendanceDate, :status, :modalidad, :attendance, NOW(), NOW())
           ON DUPLICATE KEY UPDATE
             operation_id = VALUES(operation_id),
             nombre = VALUES(nombre),
             status = VALUES(status),
             modalidad = VALUES(modalidad),
             attendance = VALUES(attendance),
             updated_at = NOW()`,
          { operationId, plantel, grado, grupo, attendanceDate, ...record }
        )
      }

      const summary = {
        ok: true,
        operationId,
        idempotent: Boolean(existing),
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
          sinMarcar: records.filter((record) => record.status === 'unmarked').length
        }
      }

      await connection.execute(
        `UPDATE attendance_operations
         SET status = 'success', result_json = :resultJson, updated_at = NOW()
         WHERE operation_id = :operationId`,
        { operationId, resultJson: JSON.stringify(summary) }
      )

      return summary
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
      retryStatus: 'client_will_retry_with_same_operation_id'
    })
    throw createError({ statusCode: 503, statusMessage: 'No disponible' })
  }
})
