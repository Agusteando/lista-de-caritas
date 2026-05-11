import dayjs from 'dayjs'
import { createError } from 'h3'
import { routeGroup } from '../../../../../../utils/validation'
import { useDbPool } from '../../../../../../utils/db'
import { logTechnicalFailure } from '../../../../../../utils/logger'
import { readPortableAttendanceRows, normalizeStudentName, statusFromLegacyFields } from '../../../../../../utils/attendanceSources'
import { loadLegacyPlantelStudents } from '../../../../../../utils/legacyRoster'

const LOGRO_CATEGORIES = [
  'Participación',
  'Esfuerzo',
  'Ayuda a compañeros',
  'Puntualidad',
  'Buena actitud',
  'Trabajo completo',
  'Lectura',
  'Liderazgo'
] as const

const RECOGNITION_STREAKS: Record<string, string> = {
  'Participación': 'Racha de participación',
  'Buena actitud': 'Racha de buena actitud',
  'Trabajo completo': 'Racha de trabajo completo'
}

interface CategoryPointRow {
  student_id: string
  category: string
  points: number | string | null
}

interface WeeklyPointRow {
  student_id: string
  points_this_week: number | string | null
}

interface EventRow {
  student_id: string
  category: string
  points: number
  streak_bonus: number
  weekly_milestone_bonus: number
  awarded_at: string | Date
}

const emptyState = (studentId: string) => ({
  studentId,
  pointsThisWeek: 0,
  categoryPoints: {} as Record<string, number>,
  recent: [] as Array<{ category: string; points: number; awardedAt: string }>,
  streaks: {
    'Racha de asistencia': 0,
    'Racha de participación': 0,
    'Racha de buena actitud': 0,
    'Racha de trabajo completo': 0
  } as Record<string, number>,
  badges: [] as Array<{ category: string; level: 'Bronce' | 'Plata' | 'Oro' | 'Diamante' }>,
  bestCategory: undefined as string | undefined
})

const badgeLevels: Array<{ level: 'Bronce' | 'Plata' | 'Oro' | 'Diamante'; min: number }> = [
  { level: 'Bronce', min: 5 },
  { level: 'Plata', min: 10 },
  { level: 'Oro', min: 20 },
  { level: 'Diamante', min: 40 }
]

function consecutiveCalendarDaysFromLatest(dates: Iterable<string>) {
  const sorted = [...new Set(dates)].sort((a, b) => dayjs(b).valueOf() - dayjs(a).valueOf())
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

export default defineEventHandler(async (event) => {
  const { plantel, grado, grupo } = routeGroup(event)
  const today = dayjs()
  const weekStart = today.subtract((today.day() + 6) % 7, 'day').startOf('day')
  const weekEnd = weekStart.add(6, 'day')

  try {
    const pool = useDbPool()

    const [categoryRows] = await pool.execute(
      `SELECT student_id, category, COALESCE(SUM(points), 0) AS points
       FROM logro_events
       WHERE plantel = :plantel
         AND grado = :grado
         AND grupo = :grupo
       GROUP BY student_id, category`,
      { plantel, grado, grupo }
    ) as unknown as [CategoryPointRow[], unknown]

    const [weeklyRows] = await pool.execute(
      `SELECT student_id, COALESCE(SUM(points + streak_bonus + weekly_milestone_bonus), 0) AS points_this_week
       FROM logro_events
       WHERE plantel = :plantel
         AND grado = :grado
         AND grupo = :grupo
         AND DATE(awarded_at) BETWEEN :weekStart AND :weekEnd
       GROUP BY student_id`,
      { plantel, grado, grupo, weekStart: weekStart.format('YYYY-MM-DD'), weekEnd: weekEnd.format('YYYY-MM-DD') }
    ) as unknown as [WeeklyPointRow[], unknown]

    const [eventRows] = await pool.execute(
      `SELECT student_id, category, points, streak_bonus, weekly_milestone_bonus, awarded_at
       FROM logro_events
       WHERE plantel = :plantel
         AND grado = :grado
         AND grupo = :grupo
         AND awarded_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 120 DAY)
       ORDER BY awarded_at DESC`,
      { plantel, grado, grupo }
    ) as unknown as [EventRow[], unknown]

    const attendanceStart = today.subtract(120, 'day').format('YYYY-MM-DD')
    const attendanceRows = await readPortableAttendanceRows(pool, {
      plantel,
      grado,
      grupo,
      startDate: attendanceStart,
      endDate: today.format('YYYY-MM-DD')
    })
    const rosterStudents = await loadLegacyPlantelStudents(plantel, { includePhotos: false })
    const studentIdByName = new Map(
      rosterStudents
        .filter((student) => student.grado === grado && student.grupo === grupo)
        .map((student) => [normalizeStudentName(student.nombre), student.id])
    )

    const states: Record<string, ReturnType<typeof emptyState>> = {}
    const stateFor = (studentId: string) => {
      states[studentId] ||= emptyState(studentId)
      return states[studentId]
    }

    for (const row of weeklyRows) {
      stateFor(String(row.student_id)).pointsThisWeek = Number(row.points_this_week || 0)
    }

    for (const row of categoryRows) {
      const studentId = String(row.student_id)
      const category = String(row.category)
      const state = stateFor(studentId)
      state.categoryPoints[category] = Number(row.points || 0)
    }

    const datesByStudentAndCategory = new Map<string, Set<string>>()
    for (const row of eventRows) {
      const studentId = String(row.student_id)
      const category = String(row.category)
      const awardedAt = dayjs(row.awarded_at)
      const state = stateFor(studentId)
      if (state.recent.length < 8) {
        state.recent.push({
          category,
          points: Number(row.points || 0) + Number(row.streak_bonus || 0) + Number(row.weekly_milestone_bonus || 0),
          awardedAt: awardedAt.toISOString()
        })
      }
      if (RECOGNITION_STREAKS[category]) {
        const key = `${studentId}:${category}`
        if (!datesByStudentAndCategory.has(key)) datesByStudentAndCategory.set(key, new Set())
        datesByStudentAndCategory.get(key)?.add(awardedAt.format('YYYY-MM-DD'))
      }
    }

    for (const [key, dates] of datesByStudentAndCategory.entries()) {
      const [studentId, category] = key.split(':')
      const streakName = RECOGNITION_STREAKS[category]
      if (streakName) stateFor(studentId).streaks[streakName] = consecutiveCalendarDaysFromLatest(dates)
    }

    const attendanceDatesByStudent = new Map<string, Set<string>>()
    for (const row of attendanceRows) {
      const normalized = statusFromLegacyFields(row)
      if (normalized.status !== 'present') continue
      const studentId = studentIdByName.get(normalizeStudentName(row.nombre))
      if (!studentId) continue
      if (!attendanceDatesByStudent.has(studentId)) attendanceDatesByStudent.set(studentId, new Set())
      attendanceDatesByStudent.get(studentId)?.add(row.date)
    }
    for (const [studentId, dates] of attendanceDatesByStudent.entries()) {
      stateFor(studentId).streaks['Racha de asistencia'] = consecutiveCalendarDaysFromLatest(dates)
    }

    for (const [studentId, state] of Object.entries(states)) {
      const categoryEntries = LOGRO_CATEGORIES.map((category) => ({ category, points: Number(state.categoryPoints[category] || 0) }))
      state.bestCategory = categoryEntries.slice().sort((a, b) => b.points - a.points)[0]?.category
      state.badges = categoryEntries.flatMap(({ category, points }) => badgeLevels
        .filter((level) => points >= level.min)
        .map((level) => ({ category, level: level.level })))
      states[studentId] = state
    }

    return {
      plantel,
      grado,
      grupo,
      weekStart: weekStart.format('YYYY-MM-DD'),
      weekEnd: weekEnd.format('YYYY-MM-DD'),
      states
    }
  } catch (err) {
    await logTechnicalFailure(event, {
      endpoint: 'GET /api/planteles/:plantel/grupos/:grado/:grupo/logros-estado',
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
