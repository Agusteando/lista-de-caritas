import type { AttendanceSubmission } from '~/types/domain'
import type { PendingAttendanceEntry } from '~/types/storage'

export function useAttendanceQueue() {
  const storageKey = 'lista-de-caritas:attendance:pending'
  const pendingCount = ref(0)

  const load = (): PendingAttendanceEntry[] => {
    if (!import.meta.client) return []
    try {
      const raw = localStorage.getItem(storageKey)
      const entries = raw ? JSON.parse(raw) as PendingAttendanceEntry[] : []
      pendingCount.value = entries.length
      return entries
    } catch {
      pendingCount.value = 0
      return []
    }
  }

  const saveAll = (entries: PendingAttendanceEntry[]) => {
    if (!import.meta.client) return
    localStorage.setItem(storageKey, JSON.stringify(entries))
    pendingCount.value = entries.length
  }

  const enqueue = (submission: AttendanceSubmission) => {
    const entries = load().filter((entry) => entry.operationId !== submission.operationId)
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
