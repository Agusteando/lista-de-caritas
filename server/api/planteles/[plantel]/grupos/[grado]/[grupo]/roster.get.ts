import { createError } from 'h3'
import { routeGroup } from '../../../../../../utils/validation'
import { buildGroupMeta, loadLegacyPlantelStudents } from '../../../../../../utils/legacyRoster'
import { logTechnicalFailure } from '../../../../../../utils/logger'

export default defineEventHandler(async (event) => {
  const { plantel, grado, grupo } = routeGroup(event)
  try {
    const allStudents = await loadLegacyPlantelStudents(plantel, { includePhotos: true })
    const students = allStudents.filter((student) => student.grado === grado && student.grupo === grupo)

    return {
      plantel,
      grado,
      grupo,
      version: `${students.length}:${plantel}:${grado}:${grupo}`,
      meta: buildGroupMeta(plantel, grado, grupo, students),
      students
    }
  } catch (err) {
    await logTechnicalFailure(event, {
      endpoint: 'GET /api/planteles/:plantel/grupos/:grado/:grupo/roster',
      plantel,
      grado,
      grupo,
      payloadSummary: { plantel, grado, grupo },
      failureReason: err instanceof Error ? err.stack || err.message : String(err),
      retryStatus: 'safe_to_retry'
    })
    throw createError({ statusCode: 503, statusMessage: 'No disponible' })
  }
})
