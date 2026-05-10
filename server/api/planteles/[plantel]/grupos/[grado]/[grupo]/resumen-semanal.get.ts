import { createError, getQuery } from 'h3'
import { routeGroup } from '../../../../../../utils/validation'
import { useDbPool } from '../../../../../../utils/db'
import { ensureDatabaseSchema } from '../../../../../../utils/schema'
import { logTechnicalFailure } from '../../../../../../utils/logger'
import { summarizeWeeklyAttendance } from '../../../../../../utils/attendanceSources'

export default defineEventHandler(async (event) => {
  const { plantel, grado, grupo } = routeGroup(event)
  const query = getQuery(event)

  try {
    const pool = useDbPool()
    await ensureDatabaseSchema(pool)
    const summary = await summarizeWeeklyAttendance(pool, { plantel, grado, grupo, date: query.date })

    return {
      plantel,
      grado,
      grupo,
      ...summary
    }
  } catch (err) {
    await logTechnicalFailure(event, {
      endpoint: 'GET /api/planteles/:plantel/grupos/:grado/:grupo/resumen-semanal',
      plantel,
      grado,
      grupo,
      payloadSummary: { plantel, grado, grupo, date: query.date },
      failureReason: err instanceof Error ? err.stack || err.message : String(err),
      retryStatus: 'safe_to_retry'
    })
    throw createError({ statusCode: 503, statusMessage: 'No disponible' })
  }
})
