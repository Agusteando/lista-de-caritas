import { createError, readBody } from 'h3'
import { allowedPlantel, normalizeGrade, normalizeGroup, normalizePlantel } from '../utils/constants'
import { withTransaction } from '../utils/db'
import { stableHash } from '../utils/hash'
import { logTechnicalFailure } from '../utils/logger'

const CATEGORIES = new Set([
  'Participación',
  'Esfuerzo',
  'Ayuda a compañeros',
  'Puntualidad',
  'Buena actitud',
  'Trabajo completo',
  'Lectura',
  'Liderazgo'
])

interface LogroBody {
  operationId?: string
  studentId?: string
  plantel?: string
  grado?: string
  grupo?: string
  category?: string
  points?: number
  featured?: boolean
  streakBonus?: number
  weeklyMilestoneBonus?: number
  awardedAt?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<LogroBody>(event)
  const operationId = String(body.operationId || '').trim()
  const studentId = String(body.studentId || '').trim()
  const plantel = normalizePlantel(body.plantel)
  const grado = normalizeGrade(body.grado)
  const grupo = normalizeGroup(body.grupo)
  const category = String(body.category || '')

  try {
    if (!operationId || operationId.length > 120) throw createError({ statusCode: 400, statusMessage: 'Operación no válida' })
    if (!studentId) throw createError({ statusCode: 400, statusMessage: 'Alumno no válido' })
    if (!allowedPlantel(plantel) || !grado || !grupo) throw createError({ statusCode: 400, statusMessage: 'Contexto no válido' })
    if (!CATEGORIES.has(category)) throw createError({ statusCode: 400, statusMessage: 'Logro no válido' })

    const points = Number(body.points || 1)
    const streakBonus = Number(body.streakBonus || 0)
    const weeklyMilestoneBonus = Number(body.weeklyMilestoneBonus || 0)
    const totalPoints = points + streakBonus + weeklyMilestoneBonus
    const payloadHash = stableHash({ studentId, plantel, grado, grupo, category, points, streakBonus, weeklyMilestoneBonus })

    const result = await withTransaction(async (connection) => {
      const [existingRows] = await connection.execute(
        'SELECT operation_id, status, result_json FROM logro_operations WHERE operation_id = :operationId FOR UPDATE',
        { operationId }
      ) as unknown as [Array<{ operation_id: string; status: string; result_json: string | null }>, unknown]

      const existing = existingRows[0]
      if (existing?.status === 'success') {
        return existing.result_json ? JSON.parse(existing.result_json) : { ok: true, idempotent: true }
      }

      if (!existing) {
        await connection.execute(
          `INSERT INTO logro_operations
             (operation_id, plantel, grado, grupo, status, payload_hash, created_at, updated_at)
           VALUES (:operationId, :plantel, :grado, :grupo, 'pending', :payloadHash, NOW(), NOW())`,
          { operationId, plantel, grado, grupo, payloadHash }
        )
      }

      await connection.execute(
        `INSERT INTO logro_events
           (operation_id, student_id, plantel, grado, grupo, category, points, featured, streak_bonus, weekly_milestone_bonus, awarded_at, created_at)
         VALUES
           (:operationId, :studentId, :plantel, :grado, :grupo, :category, :points, :featured, :streakBonus, :weeklyMilestoneBonus, COALESCE(:awardedAt, NOW()), NOW())`,
        {
          operationId,
          studentId,
          plantel,
          grado,
          grupo,
          category,
          points,
          featured: body.featured ? 1 : 0,
          streakBonus,
          weeklyMilestoneBonus,
          awardedAt: body.awardedAt || null
        }
      )

      const summary = {
        ok: true,
        operationId,
        idempotent: Boolean(existing),
        studentId,
        category,
        points: totalPoints,
        savedAt: new Date().toISOString()
      }

      await connection.execute(
        `UPDATE logro_operations
         SET status = 'success', result_json = :resultJson, updated_at = NOW()
         WHERE operation_id = :operationId`,
        { operationId, resultJson: JSON.stringify(summary) }
      )

      return summary
    })

    return result
  } catch (err) {
    await logTechnicalFailure(event, {
      endpoint: 'POST /api/logros',
      operationId,
      plantel,
      grado,
      grupo,
      payloadSummary: { studentId, category, points: body.points, streakBonus: body.streakBonus, weeklyMilestoneBonus: body.weeklyMilestoneBonus },
      failureReason: err instanceof Error ? err.stack || err.message : String(err),
      retryStatus: 'client_can_retry_with_same_operation_id'
    })
    throw createError({ statusCode: 503, statusMessage: 'No disponible' })
  }
})
