import type { GroupMeta, PlantelMeta, Student } from '~/types/domain'
import type { RosterCacheEntry } from '~/types/storage'

export function useRosterCache() {
  const appPrefix = 'lista-de-caritas'
  const keyFor = (plantel: string, grado: string, grupo: string) =>
    `${appPrefix}:roster:${plantel.toUpperCase()}:${grado.toLowerCase()}:${grupo.toUpperCase()}`
  const metaKeyFor = (plantel: string) => `${appPrefix}:meta:${plantel.toUpperCase()}`

  const readLocal = <T>(key: string): T | null => {
    if (!import.meta.client) return null
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) as T : null
    } catch {
      return null
    }
  }

  const writeLocal = (key: string, value: unknown) => {
    if (!import.meta.client) return
    localStorage.setItem(key, JSON.stringify(value))
  }

  const readRosterCache = (plantel: string, grado: string, grupo: string): RosterCacheEntry | null =>
    readLocal<RosterCacheEntry>(keyFor(plantel, grado, grupo))

  const writeRosterCache = (plantel: string, grado: string, grupo: string, students: Student[], version?: string, meta?: GroupMeta) => {
    const entry: RosterCacheEntry = { plantel, grado, grupo, students, version, meta, savedAt: new Date().toISOString() }
    writeLocal(keyFor(plantel, grado, grupo), entry)
  }

  const readPlantelMetaCache = (plantel: string): (PlantelMeta & { savedAt?: string }) | null =>
    readLocal<PlantelMeta & { savedAt?: string }>(metaKeyFor(plantel))

  const writePlantelMetaCache = (plantel: string, meta: PlantelMeta) => {
    writeLocal(metaKeyFor(plantel), { ...meta, savedAt: new Date().toISOString() })
  }

  const mergeStudents = (current: Student[], incoming: Student[]) => {
    const incomingById = new Map(incoming.map((student) => [student.id, student]))
    const currentIds = new Set(current.map((student) => student.id))
    const updatedCurrent = current.map((student) => {
      const fresh = incomingById.get(student.id)
      return fresh ? { ...student, ...fresh } : student
    })
    const additions = incoming
      .filter((student) => !currentIds.has(student.id))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))
    return [...updatedCurrent, ...additions]
  }

  return { readRosterCache, writeRosterCache, readPlantelMetaCache, writePlantelMetaCache, mergeStudents }
}
