import dayjs from 'dayjs'
import { createError } from 'h3'
import { routeGroup } from '../../../../../../utils/validation'
import { useDbPool } from '../../../../../../utils/db'
import { ensureLogrosSchema } from '../../../../../../utils/schema'
import { logTechnicalFailure } from '../../../../../../utils/logger'

interface SummaryRow {
  total_points: number | null
  total_events: number
  active_students: number
}

interface CategoryRow {
  category: string
  total_events: number
}

export default defineEventHandler(async (event) => {
  const { plantel, grado, grupo } = routeGroup(event)
  const today = dayjs()
  const weekStart = today.subtract((today.day() + 6) % 7, 'day').startOf('day')
  const weekEnd = weekStart.add(6, 'day')

  try {
    const pool = useDbPool()
    await ensureLogrosSchema(pool)
    const [rows] = await pool.execute(
      `SELECT COALESCE(SUM(points + streak_bonus + weekly_milestone_bonus), 0) AS total_points,
              COUNT(*) AS total_events,
              COUNT(DISTINCT student_id) AS active_students
       FROM logro_events
       WHERE plantel = :plantel
         AND grado = :grado
         AND grupo = :grupo
         AND DATE(awarded_at) BETWEEN :weekStart AND :weekEnd`,
      {
        plantel,
        grado,
        grupo,
        weekStart: weekStart.format('YYYY-MM-DD'),
        weekEnd: weekEnd.format('YYYY-MM-DD')
      }
    ) as unknown as [SummaryRow[], unknown]

    const [categoryRows] = await pool.execute(
      `SELECT category, COUNT(*) AS total_events
       FROM logro_events
       WHERE plantel = :plantel
         AND grado = :grado
         AND grupo = :grupo
         AND DATE(awarded_at) BETWEEN :weekStart AND :weekEnd
       GROUP BY category
       ORDER BY total_events DESC, category ASC
       LIMIT 1`,
      {
        plantel,
        grado,
        grupo,
        weekStart: weekStart.format('YYYY-MM-DD'),
        weekEnd: weekEnd.format('YYYY-MM-DD')
      }
    ) as unknown as [CategoryRow[], unknown]

    const summary = rows[0] || { total_points: 0, total_events: 0, active_students: 0 }
    return {
      plantel,
      grado,
      grupo,
      totalPoints: Number(summary.total_points || 0),
      totalEvents: Number(summary.total_events || 0),
      activeStudents: Number(summary.active_students || 0),
      topCategory: categoryRows[0]?.category || null,
      weekStart: weekStart.format('YYYY-MM-DD'),
      weekEnd: weekEnd.format('YYYY-MM-DD')
    }
  } catch (err) {
    await logTechnicalFailure(event, {
      endpoint: 'GET /api/planteles/:plantel/grupos/:grado/:grupo/logros-resumen',
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
