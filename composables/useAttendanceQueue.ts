import type { AttendanceSubmission } from '~/types/domain'
import type { PendingAttendanceEntry } from '~/types/storage'

export function useAttendanceQueue() {
  const storageKey = 'lista-de-caritas:attendance:pending'
  const pendingCount = ref(0)

  const dailyKeyFor = (submission: AttendanceSubmission) => [
    submission.plantel,
    submission.grado,
    submission.grupo,
    submission.attendanceDate
  ].map((value) => String(value || '').trim()).join('|')

  const entryTime = (entry: PendingAttendanceEntry) => {
    const savedAt = Date.parse(entry.savedAt || '')
    const submittedAt = Date.parse(entry.submission?.submittedAt || '')
    return Math.max(Number.isFinite(savedAt) ? savedAt : 0, Number.isFinite(submittedAt) ? submittedAt : 0)
  }

  const collapseDailyDuplicates = (entries: PendingAttendanceEntry[]) => {
    const latestByDailyKey = new Map<string, PendingAttendanceEntry>()

    for (const entry of entries) {
      const key = dailyKeyFor(entry.submission)
      const existing = latestByDailyKey.get(key)
      if (!existing || entryTime(entry) >= entryTime(existing)) latestByDailyKey.set(key, entry)
    }

    return [...latestByDailyKey.values()].sort((a, b) => entryTime(a) - entryTime(b))
  }

  const load = (): PendingAttendanceEntry[] => {
    if (!import.meta.client) return []
    try {
      const raw = localStorage.getItem(storageKey)
      const entries = raw ? JSON.parse(raw) as PendingAttendanceEntry[] : []
      const collapsed = collapseDailyDuplicates(entries.filter((entry) => entry?.operationId && entry?.submission))
      if (collapsed.length !== entries.length) localStorage.setItem(storageKey, JSON.stringify(collapsed))
      pendingCount.value = collapsed.length
      return collapsed
    } catch {
      pendingCount.value = 0
      return []
    }
  }

  const saveAll = (entries: PendingAttendanceEntry[]) => {
    if (!import.meta.client) return
    const collapsed = collapseDailyDuplicates(entries)
    if (!collapsed.length) localStorage.removeItem(storageKey)
    else localStorage.setItem(storageKey, JSON.stringify(collapsed))
    pendingCount.value = collapsed.length
  }

  const enqueue = (submission: AttendanceSubmission) => {
    const submissionDailyKey = dailyKeyFor(submission)
    const entries = load().filter((entry) => (
      entry.operationId !== submission.operationId && dailyKeyFor(entry.submission) !== submissionDailyKey
    ))

    entries.push({
      operationId: submission.operationId,
      plantel: submission.plantel,
      grado: submission.grado,
      grupo: submission.grupo,
      submission,
      savedAt: new Date().toISOString()
    })
    saveAll(entries)
  }

  const remove = (operationId: string) => {
    saveAll(load().filter((entry) => entry.operationId !== operationId))
  }

  const flush = async () => {
    const entries = load()
    for (const entry of entries) {
      const latestEntries = load()
      const latestForSameDay = latestEntries.find((candidate) => dailyKeyFor(candidate.submission) === dailyKeyFor(entry.submission))
      if (latestForSameDay?.operationId !== entry.operationId) continue

      try {
        await $fetch('/api/asistencia', { method: 'POST', body: entry.submission })
        remove(entry.operationId)
      } catch {
        pendingCount.value = load().length
        return false
      }
    }
    pendingCount.value = load().length
    return true
  }

  if (import.meta.client) {
    pendingCount.value = load().length
    window.addEventListener('online', () => { void flush() })
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void flush()
    })
  }

  return { pendingCount, enqueue, remove, flush, load }
}
