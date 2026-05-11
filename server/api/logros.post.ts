import dayjs from 'dayjs'
import { createError, readBody } from 'h3'
import { allowedPlantel, normalizeGrade, normalizeGroup, normalizePlantel } from '../utils/constants'
import { withLogrosTransaction } from '../utils/db'
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

const RECOGNITION_STREAK_CATEGORIES = new Set([
  'Participación',
  'Buena actitud',
  'Trabajo completo'
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

interface StreakDateRow {
  awarded_date: string | Date
}

interface WeeklyPointRow {
  points_before: number | string | null
}

function consecutiveCalendarDaysFromLatest(dates: Iterable<string>) {
  const sorted = [...new Set(dates)]
    .filter(Boolean)
    .sort((a, b) => dayjs(b).valueOf() - dayjs(a).valueOf())

  if (!sorted.length) return 0

  let streak = 1
  let cursor = dayjs(sorted[0]).startOf('day')
  for (const date of sorted.slice(1)) {
    const next = dayjs(date).startOf('day')
    if (cursor.diff(next, 'day') === 1) {
      streak += 1
      cursor = next
    } else if (cursor.isSame(next, 'day')) {
      continue
    } else {
      break
    }
  }
  return streak
}

function normalizedAwardedAt(value?: string) {
  const parsed = value ? dayjs(value) : dayjs()
  return parsed.isValid() ? parsed : dayjs()
}

export default defineEventHandler(async (event) => {
  const body = await readBody<LogroBody>(event)
  const operationId = String(body.operationId || '').trim()
  const studentId = String(body.studentId || '').trim()
  const plantel = normalizePlantel(body.plantel)
  const grado = normalizeGrade(body.grado)
  const grupo = normalizeGroup(body.grupo)
  const category = String(body.category || '')
  const awardedAt = normalizedAwardedAt(body.awardedAt)
  const awardedAtIso = awardedAt.toISOString()
  const awardedAtSql = awardedAt.format('YYYY-MM-DD HH:mm:ss')
  const awardedDate = awardedAt.format('YYYY-MM-DD')
  const weekStart = awardedAt.subtract((awardedAt.day() + 6) % 7, 'day').startOf('day').format('YYYY-MM-DD')
  const weekEnd = dayjs(weekStart).add(6, 'day').format('YYYY-MM-DD')

  try {
    if (!operationId || operationId.length > 120) throw createError({ statusCode: 400, statusMessage: 'Operación no válida' })
    if (!studentId) throw createError({ statusCode: 400, statusMessage: 'Alumno no válido' })
    if (!allowedPlantel(plantel) || !grado || !grupo) throw createError({ statusCode: 400, statusMessage: 'Contexto no válido' })
    if (!CATEGORIES.has(category)) throw createError({ statusCode: 400, statusMessage: 'Logro no válido' })

    const requestedPoints = Number(body.points || 1)
    const points = Number.isFinite(requestedPoints) ? Math.max(1, requestedPoints) : 1

    const result = await withLogrosTransaction(async (connection) => {
      const [existingRows] = await connection.execute(
        'SELECT operation_id, status, result_json FROM logro_operations WHERE operation_id = :operationId FOR UPDATE',
        { operationId }
      ) as unknown as [Array<{ operation_id: string; status: string; result_json: string | null }>, unknown]

      const existing = existingRows[0]
      if (existing?.status === 'success') {
        return existing.result_json ? JSON.parse(existing.result_json) : { ok: true, idempotent: true }
      }

      let streakBonus = 0
      if (RECOGNITION_STREAK_CATEGORIES.has(category)) {
        const [streakRows] = await connection.execute(
          `SELECT DISTINCT DATE_FORMAT(awarded_at, '%Y-%m-%d') AS awarded_date
           FROM logro_events
           WHERE student_id = :studentId
             AND plantel = :plantel
             AND grado = :grado
             AND grupo = :grupo
             AND category = :category
             AND DATE(awarded_at) BETWEEN DATE_SUB(:awardedDate, INTERVAL 45 DAY) AND :awardedDate`,
          { studentId, plantel, grado, grupo, category, awardedDate }
        ) as unknown as [StreakDateRow[], unknown]
        const streak = consecutiveCalendarDaysFromLatest([
          ...streakRows.map((row) => dayjs(row.awarded_date).format('YYYY-MM-DD')),
          awardedDate
        ])
        streakBonus = streak >= 3 ? 1 : 0
      }

      const [weeklyRows] = await connection.execute(
        `SELECT COALESCE(SUM(points + streak_bonus + weekly_milestone_bonus), 0) AS points_before
         FROM logro_events
         WHERE student_id = :studentId
           AND plantel = :plantel
           AND grado = :grado
           AND grupo = :grupo
           AND DATE(awarded_at) BETWEEN :weekStart AND :weekEnd`,
        { studentId, plantel, grado, grupo, weekStart, weekEnd }
      ) as unknown as [WeeklyPointRow[], unknown]

      const pointsBefore = Number(weeklyRows[0]?.points_before || 0)
      const weeklyMilestoneBonus = Math.floor((pointsBefore + points + streakBonus) / 10) > Math.floor(pointsBefore / 10) ? 3 : 0
      const totalPoints = points + streakBonus + weeklyMilestoneBonus
      const payloadHash = stableHash({ studentId, plantel, grado, grupo, category, points, streakBonus, weeklyMilestoneBonus, awardedAt: awardedAtIso })

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
           (:operationId, :studentId, :plantel, :grado, :grupo, :category, :points, :featured, :streakBonus, :weeklyMilestoneBonus, :awardedAt, NOW())`,
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
          awardedAt: awardedAtSql
        }
      )

      const summary = {
        ok: true,
        operationId,
        idempotent: Boolean(existing),
        studentId,
        category,
        points: totalPoints,
        streakBonus,
        weeklyMilestoneBonus,
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
      payloadSummary: {
        studentId,
        category,
        points: body.points,
        clientStreakBonus: body.streakBonus,
        clientWeeklyMilestoneBonus: body.weeklyMilestoneBonus
      },
      failureReason: err instanceof Error ? err.stack || err.message : String(err),
      retryStatus: 'client_can_retry_with_same_operation_id'
    })
    throw createError({ statusCode: 503, statusMessage: 'No disponible' })
  }
})
