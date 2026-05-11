import dayjs from 'dayjs'
import type { AttendanceStatus, ClassLogrosSummary, LogroCategory, Student, WeeklyAttendanceSummary } from '~/types/domain'

export type AttendanceTotals = {
  total: number
  presentes: number
  faltas: number
  enfermedad: number
  sinMarcar: number
}

export type WeeklyDisplayDay = WeeklyAttendanceSummary['days'][number] & {
  isPreview?: boolean
}

export const WEEKDAY_LABELS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'] as const

export const normalizeStudentName = (value: unknown) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .trim()

export const getGradeDisplay = (grado: string) => grado.replace(/^\w/, (c) => c.toUpperCase())

export const getClassCode = (plantel: string, gradeDisplay: string, grupo: string) =>
  `${plantel}-${gradeDisplay}-${grupo}`.replace(/\s+/g, '-').toUpperCase()

export const statusToLegacy = (value: AttendanceStatus) => {
  if (value === 'present') return { modalidad: '1' as const, attendance: 1 as const }
  if (value === 'sick') return { modalidad: '2' as const, attendance: 0 as const }
  if (value === 'absent') return { modalidad: '0' as const, attendance: 0 as const }
  return { modalidad: '9' as const, attendance: 0 as const }
}

export const getAttendanceTotals = (students: Student[], attendance: Record<string, AttendanceStatus>): AttendanceTotals => {
  const values = Object.values(attendance)
  const marked = values.filter((value) => value !== 'unmarked')

  return {
    total: students.length,
    presentes: values.filter((value) => value === 'present').length,
    faltas: values.filter((value) => value === 'absent').length,
    enfermedad: values.filter((value) => value === 'sick').length,
    sinMarcar: students.length - marked.length
  }
}

export const buildWeeklyDisplayDays = (
  selectedDate: string,
  weeklySummary: WeeklyAttendanceSummary | null,
  attendance: Record<string, AttendanceStatus>
): WeeklyDisplayDay[] => {
  const selected = dayjs(selectedDate)
  const weekStart = selected.subtract((selected.day() + 6) % 7, 'day').startOf('day')
  const baseDays = weeklySummary?.days?.length
    ? weeklySummary.days
    : Array.from({ length: 5 }, (_, index) => {
        const date = weekStart.add(index, 'day')
        return {
          date: date.format('YYYY-MM-DD'),
          label: WEEKDAY_LABELS[date.day()],
          shortLabel: date.format('D'),
          presentes: 0,
          faltas: 0,
          enfermedad: 0,
          total: 0,
          isToday: date.isSame(selected, 'day')
        }
      })

  const values = Object.values(attendance)
  const liveCounts = {
    presentes: values.filter((value) => value === 'present').length,
    faltas: values.filter((value) => value === 'absent').length,
    enfermedad: values.filter((value) => value === 'sick').length
  }
  const liveTotal = liveCounts.presentes + liveCounts.faltas + liveCounts.enfermedad

  return baseDays.map((day) => {
    const isSelected = day.date === selectedDate
    if (!isSelected || liveTotal === 0) return { ...day, isToday: isSelected }

    return {
      ...day,
      ...liveCounts,
      total: liveTotal,
      isToday: true,
      isPreview: true
    }
  })
}

export const summarizeLogroState = (
  states: Record<string, { pointsThisWeek?: number; recent?: unknown[]; categoryPoints?: Partial<Record<LogroCategory, number>>; streaks?: Record<string, number> }>,
  server: ClassLogrosSummary | null,
  featuredCategory: LogroCategory
) => {
  const stateList = Object.values(states || {})
  const categoryTotals = new Map<LogroCategory, number>()

  for (const state of stateList) {
    for (const [category, value] of Object.entries(state.categoryPoints || {}) as Array<[LogroCategory, number]>) {
      categoryTotals.set(category, (categoryTotals.get(category) || 0) + Number(value || 0))
    }
  }

  const localTopCategory = [...categoryTotals.entries()]
    .filter(([, points]) => points > 0)
    .sort((a, b) => b[1] - a[1])[0]?.[0]

  const local = {
    totalPoints: stateList.reduce((sum, state) => sum + (state.pointsThisWeek || 0), 0),
    totalEvents: stateList.reduce((sum, state) => sum + (state.recent?.length || 0), 0),
    activeStudents: stateList.filter((state) => (state.pointsThisWeek || 0) > 0).length,
    topStreak: stateList.reduce((max, state) => Math.max(max, ...Object.entries(state.streaks || {})
      .filter(([name]) => name !== 'Racha de asistencia')
      .map(([, value]) => Number(value || 0))), 0)
  }

  return {
    totalPoints: Math.max(local.totalPoints, server?.totalPoints || 0),
    totalEvents: Math.max(local.totalEvents, server?.totalEvents || 0),
    activeStudents: Math.max(local.activeStudents, server?.activeStudents || 0),
    topCategory: server?.topCategory || localTopCategory || featuredCategory,
    topStreak: local.topStreak
  }
}

export const getLogrosClassCopy = (
  weeklySummary: WeeklyAttendanceSummary | null,
  logroSummary: { totalEvents: number; totalPoints: number; activeStudents?: number }
) => {
  const events = logroSummary.totalEvents
  const points = logroSummary.totalPoints
  const activeStudents = logroSummary.activeStudents || 0
  const positiveWeekStreak = weeklySummary?.positiveWeekStreak || 0
  const streakCopy = positiveWeekStreak > 0
    ? `${positiveWeekStreak} ${positiveWeekStreak === 1 ? 'semana positiva' : 'semanas positivas'}`
    : ''

  if (events > 0) {
    return {
      headline: `${events} ${events === 1 ? 'logro' : 'logros'}`,
      line: [
        `${points} ${points === 1 ? 'punto' : 'puntos'}`,
        `${activeStudents} ${activeStudents === 1 ? 'alumno activo' : 'alumnos activos'}`,
        streakCopy
      ].filter(Boolean).join(' · ')
    }
  }

  if (positiveWeekStreak > 0) {
    return {
      headline: `${positiveWeekStreak} ${positiveWeekStreak === 1 ? 'semana positiva' : 'semanas positivas'}`,
      line: 'Más presentes que faltas con datos reales.'
    }
  }

  return {
    headline: '0 logros',
    line: 'Registra reconocimientos desde aquí.'
  }
}
