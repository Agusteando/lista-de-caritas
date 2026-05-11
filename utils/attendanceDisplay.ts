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
  states: Record<string, { pointsThisWeek?: number; recent?: unknown[] }>,
  server: ClassLogrosSummary | null,
  featuredCategory: LogroCategory
) => {
  const stateList = Object.values(states || {})
  const local = {
    totalPoints: stateList.reduce((sum, state) => sum + (state.pointsThisWeek || 0), 0),
    totalEvents: stateList.reduce((sum, state) => sum + (state.recent?.length || 0), 0),
    activeStudents: stateList.filter((state) => (state.pointsThisWeek || 0) > 0).length
  }

  return {
    totalPoints: Math.max(local.totalPoints, server?.totalPoints || 0),
    totalEvents: Math.max(local.totalEvents, server?.totalEvents || 0),
    activeStudents: Math.max(local.activeStudents, server?.activeStudents || 0),
    topCategory: server?.topCategory || featuredCategory
  }
}

export const getLogrosClassCopy = (
  weeklySummary: WeeklyAttendanceSummary | null,
  logroSummary: { totalEvents: number; totalPoints: number }
) => {
  const weeks = weeklySummary?.positiveWeekStreak || 0

  if (weeks > 1) {
    return {
      headline: '¡Sigan así!',
      line: `Van ${weeks} semanas con más presentes que faltas.`
    }
  }

  if (weeks === 1) {
    return {
      headline: '¡Sigan así!',
      line: 'Esta semana va con más presentes que faltas.'
    }
  }

  if (logroSummary.totalEvents > 0) {
    const events = logroSummary.totalEvents
    const points = logroSummary.totalPoints
    return {
      headline: '¡Buen avance!',
      line: `${events} ${events === 1 ? 'logro registrado' : 'logros registrados'} · ${points} ${points === 1 ? 'punto' : 'puntos'} esta semana.`
    }
  }

  if (weeklySummary?.hasAnyAttendanceData) {
    return {
      headline: 'Clase activa',
      line: 'Asistencia semanal registrada.'
    }
  }

  return {
    headline: 'Sin logros aún',
    line: ''
  }
}
