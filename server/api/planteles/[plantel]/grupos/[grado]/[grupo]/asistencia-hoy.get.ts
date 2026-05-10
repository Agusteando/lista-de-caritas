import { createError, getQuery } from 'h3'
import { routeGroup } from '../../../../../../utils/validation'
import { useDbPool } from '../../../../../../utils/db'
import { ensureDatabaseSchema } from '../../../../../../utils/schema'
import { logTechnicalFailure } from '../../../../../../utils/logger'
import { normalizeAttendanceDate } from '../../../../../../utils/dates'
import { readDailyAttendance } from '../../../../../../utils/attendanceSources'

export default defineEventHandler(async (event) => {
  const { plantel, grado, grupo } = routeGroup(event)
  const query = getQuery(event)
  const attendanceDate = normalizeAttendanceDate(query.date)

  try {
    const pool = useDbPool()
    await ensureDatabaseSchema(pool)
    const records = await readDailyAttendance(pool, { plantel, grado, grupo, attendanceDate })

    return {
      plantel,
      grado,
      grupo,
      attendanceDate,
      records: records.map((row) => ({
        studentId: row.studentId,
        nombre: row.nombre,
        status: row.status,
        attendance: row.attendance,
        modalidad: row.modalidad,
        source: row.source
      }))
    }
  } catch (err) {
    await logTechnicalFailure(event, {
      endpoint: 'GET /api/planteles/:plantel/grupos/:grado/:grupo/asistencia-hoy',
      plantel,
      grado,
      grupo,
      payloadSummary: { plantel, grado, grupo, attendanceDate },
      failureReason: err instanceof Error ? err.stack || err.message : String(err),
      retryStatus: 'safe_to_retry'
    })
    throw createError({ statusCode: 503, statusMessage: 'No disponible' })
  }
})
