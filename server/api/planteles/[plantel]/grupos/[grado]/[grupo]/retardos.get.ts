import { createError, getQuery } from 'h3'
import { routeGroup } from '../../../../../../utils/validation'
import { useMatriculaDbPool } from '../../../../../../utils/db'
import { logTechnicalFailure } from '../../../../../../utils/logger'
import { readRetardosForGroup } from '../../../../../../utils/retardos'

export default defineEventHandler(async (event) => {
  const { plantel, grado, grupo } = routeGroup(event)
  const query = getQuery(event)

  try {
    const result = await readRetardosForGroup(useMatriculaDbPool(), { plantel, grado, grupo, date: query.date })
    return { plantel, grado, grupo, ...result }
  } catch (err) {
    await logTechnicalFailure(event, {
      endpoint: 'GET /api/planteles/:plantel/grupos/:grado/:grupo/retardos',
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
