import dayjs from 'dayjs'

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function normalizeAttendanceDate(input?: unknown) {
  const raw = String(input || '').trim()
  if (ISO_DATE_RE.test(raw) && dayjs(raw).isValid()) return raw
  return dayjs().format('YYYY-MM-DD')
}

export function weekBoundsForAttendanceDate(input?: unknown) {
  const attendanceDate = normalizeAttendanceDate(input)
  const anchor = dayjs(attendanceDate)
  const weekStart = anchor.subtract((anchor.day() + 6) % 7, 'day').startOf('day')
  return {
    attendanceDate,
    weekStart,
    weekEnd: weekStart.add(4, 'day')
  }
}
