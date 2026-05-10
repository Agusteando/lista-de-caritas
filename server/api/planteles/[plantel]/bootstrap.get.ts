import { createError } from 'h3'
import { routePlantel } from '../../../utils/validation'
import { buildPlantelMeta, loadLegacyPlantelStudents } from '../../../utils/legacyRoster'
import { logTechnicalFailure } from '../../../utils/logger'

export default defineEventHandler(async (event) => {
  const plantel = routePlantel(event)
  try {
    const students = await loadLegacyPlantelStudents(plantel, { includePhotos: false })
    return buildPlantelMeta(plantel, students)
  } catch (err) {
    await logTechnicalFailure(event, {
      endpoint: 'GET /api/planteles/:plantel/bootstrap',
      plantel,
      payloadSummary: { plantel },
      failureReason: err instanceof Error ? err.stack || err.message : String(err),
      retryStatus: 'safe_to_retry'
    })
    throw createError({ statusCode: 503, statusMessage: 'No disponible' })
  }
})
