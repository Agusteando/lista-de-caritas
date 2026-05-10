interface RememberedContext {
  plantel: string
  grado?: string
  grupo?: string
  savedAt?: string
}

export function usePlantelMemory() {
  const appPrefix = 'lista-de-caritas'
  const keyFor = (plantel: string) => `${appPrefix}:last-context:${plantel.toUpperCase()}`
  const lastKey = `${appPrefix}:last-plantel-context`

  const readJson = <T>(key: string): T | null => {
    if (!import.meta.client) return null
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) as T : null
    } catch {
      return null
    }
  }

  const writeJson = (key: string, value: unknown) => {
    if (!import.meta.client) return
    localStorage.setItem(key, JSON.stringify(value))
  }

  const getRememberedGroup = (plantel: string) => {
    const normalizedPlantel = plantel.toUpperCase()
    const parsed = readJson<RememberedContext>(keyFor(normalizedPlantel))
    if (!parsed?.grado || !parsed?.grupo) return null
    return parsed
  }

  const getLastContext = () => {
    const parsed = readJson<RememberedContext>(lastKey)
    if (!parsed?.plantel) return null
    return parsed
  }

  const rememberPlantel = (plantel: string) => {
    const normalizedPlantel = plantel.toUpperCase()
    const existing = getRememberedGroup(normalizedPlantel)
    const value: RememberedContext = {
      plantel: normalizedPlantel,
      grado: existing?.grado,
      grupo: existing?.grupo,
      savedAt: new Date().toISOString()
    }
    writeJson(lastKey, value)
  }

  const rememberGroup = (plantel: string, grado: string, grupo: string) => {
    const normalizedPlantel = plantel.toUpperCase()
    if (!import.meta.client) return
    const value: RememberedContext = { plantel: normalizedPlantel, grado, grupo, savedAt: new Date().toISOString() }
    writeJson(keyFor(normalizedPlantel), value)
    writeJson(lastKey, value)
  }

  return { getRememberedGroup, getLastContext, rememberPlantel, rememberGroup }
}
