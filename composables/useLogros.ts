import dayjs from 'dayjs'
import type { ComputedRef, Ref } from 'vue'
import type { LogroCategory, LogroEvent, Student, StudentLogrosState } from '~/types/domain'

export const logroCategories: LogroCategory[] = [
  'Participación',
  'Esfuerzo',
  'Ayuda a compañeros',
  'Puntualidad',
  'Buena actitud',
  'Trabajo completo',
  'Lectura',
  'Liderazgo'
]

const streakCategories: Partial<Record<LogroCategory, string>> = {
  'Participación': 'Racha de participación',
  'Buena actitud': 'Racha de buena actitud',
  'Trabajo completo': 'Racha de trabajo completo'
}

export function useLogrosContext(plantel: Ref<string> | ComputedRef<string>, grado: Ref<string> | ComputedRef<string>, grupo: Ref<string> | ComputedRef<string>, students: Ref<Student[]>) {
  const states = ref<Record<string, StudentLogrosState>>({})
  const syncing = ref(false)
  const pendingEvents = ref(0)
  const featuredCategory = computed<LogroCategory>(() => logroCategories[dayjs().day() % logroCategories.length])

  const key = computed(() => `lista-de-caritas:logros:${plantel.value}:${grado.value}:${grupo.value}:${dayjs().startOf('week').format('YYYY-MM-DD')}`)

  const defaultState = (studentId: string): StudentLogrosState => ({
    studentId,
    pointsThisWeek: 0,
    categoryPoints: {},
    recent: [],
    streaks: {
      'Racha de asistencia': 0,
      'Racha de participación': 0,
      'Racha de buena actitud': 0,
      'Racha de trabajo completo': 0
    },
    badges: []
  })

  const normalizeState = (studentId: string, input?: Partial<StudentLogrosState>): StudentLogrosState => {
    const base = defaultState(studentId)
    return {
      ...base,
      ...input,
      studentId,
      categoryPoints: { ...base.categoryPoints, ...(input?.categoryPoints || {}) },
      recent: Array.isArray(input?.recent) ? input.recent.slice(0, 8) : [],
      streaks: { ...base.streaks, ...(input?.streaks || {}) },
      badges: Array.isArray(input?.badges) ? input.badges : []
    }
  }

  const load = () => {
    if (!import.meta.client) return
    try {
      const raw = localStorage.getItem(key.value)
      states.value = raw ? JSON.parse(raw) as Record<string, StudentLogrosState> : {}
    } catch {
      states.value = {}
    }
    for (const student of students.value) {
      states.value[student.id] = normalizeState(student.id, states.value[student.id])
    }
  }

  const persist = () => {
    if (!import.meta.client) return
    localStorage.setItem(key.value, JSON.stringify(states.value))
  }

  const badgesFor = (category: LogroCategory, points: number) => {
    const levels: Array<{ level: 'Bronce' | 'Plata' | 'Oro' | 'Diamante'; min: number }> = [
      { level: 'Bronce', min: 5 },
      { level: 'Plata', min: 10 },
      { level: 'Oro', min: 20 },
      { level: 'Diamante', min: 40 }
    ]
    return levels.filter((entry) => points >= entry.min).map((entry) => ({ category, level: entry.level }))
  }

  const mergeServerStates = (serverStates: Record<string, StudentLogrosState>) => {
    const next: Record<string, StudentLogrosState> = {}
    const ids = new Set([...students.value.map((student) => student.id), ...Object.keys(states.value), ...Object.keys(serverStates || {})])

    for (const studentId of ids) {
      const serverState = normalizeState(studentId, serverStates?.[studentId])
      const localState = normalizeState(studentId, states.value[studentId])
      const mergedCategoryPoints: StudentLogrosState['categoryPoints'] = {}
      for (const category of logroCategories) {
        mergedCategoryPoints[category] = Math.max(Number(serverState.categoryPoints[category] || 0), Number(localState.categoryPoints[category] || 0))
      }

      next[studentId] = {
        ...serverState,
        pointsThisWeek: Math.max(serverState.pointsThisWeek, localState.pointsThisWeek),
        categoryPoints: mergedCategoryPoints,
        recent: [...serverState.recent, ...localState.recent]
          .sort((a, b) => dayjs(b.awardedAt).valueOf() - dayjs(a.awardedAt).valueOf())
          .filter((entry, index, list) => index === list.findIndex((candidate) => candidate.awardedAt === entry.awardedAt && candidate.category === entry.category))
          .slice(0, 8),
        streaks: Object.fromEntries(Object.keys({ ...serverState.streaks, ...localState.streaks }).map((name) => [
          name,
          Math.max(Number(serverState.streaks[name] || 0), Number(localState.streaks[name] || 0))
        ])),
        badges: serverState.badges.length >= localState.badges.length ? serverState.badges : localState.badges,
        bestCategory: serverState.bestCategory || localState.bestCategory
      }
    }

    states.value = next
    persist()
  }

  const refreshFromServer = async () => {
    if (!plantel.value || !grado.value || !grupo.value || !students.value.length) return
    syncing.value = true
    try {
      const response = await $fetch<{ states: Record<string, StudentLogrosState> }>(
        `/api/planteles/${plantel.value}/grupos/${encodeURIComponent(grado.value)}/${encodeURIComponent(grupo.value)}/logros-estado`
      )
      mergeServerStates(response.states || {})
    } catch {
      // The local optimistic state remains usable. Technical details stay server-side.
    } finally {
      syncing.value = false
    }
  }

  const awardLocal = (studentId: string, category: LogroCategory) => {
    const state = normalizeState(studentId, states.value[studentId])
    const featured = category === featuredCategory.value
    const streakName = streakCategories[category]
    const streakBonus = streakName ? 1 : 0
    const currentCategoryPoints = state.categoryPoints[category] || 0
    const pointsBefore = state.pointsThisWeek
    const normalPoints = featured ? 2 : 1
    const weeklyMilestoneBonus = Math.floor((pointsBefore + normalPoints + streakBonus) / 10) > Math.floor(pointsBefore / 10) ? 3 : 0
    const totalPoints = normalPoints + streakBonus + weeklyMilestoneBonus

    state.pointsThisWeek += totalPoints
    state.categoryPoints[category] = currentCategoryPoints + normalPoints
    state.recent = [{ category, points: totalPoints, awardedAt: new Date().toISOString() }, ...state.recent].slice(0, 8)
    if (streakName) state.streaks[streakName] = (state.streaks[streakName] || 0) + 1

    const allBadges = logroCategories.flatMap((cat) => badgesFor(cat, state.categoryPoints[cat] || 0))
    state.badges = allBadges
    state.bestCategory = logroCategories
      .slice()
      .sort((a, b) => (state.categoryPoints[b] || 0) - (state.categoryPoints[a] || 0))[0]

    states.value[studentId] = { ...state }
    persist()

    const event: LogroEvent = {
      operationId: `logro_${crypto.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`}`,
      studentId,
      plantel: plantel.value,
      grado: grado.value,
      grupo: grupo.value,
      category,
      points: normalPoints,
      featured,
      streakBonus,
      weeklyMilestoneBonus,
      awardedAt: new Date().toISOString()
    }
    return event
  }

  const queueKey = 'lista-de-caritas:logros:pending'

  const readPending = () => {
    if (!import.meta.client) return [] as LogroEvent[]
    try {
      const raw = localStorage.getItem(queueKey)
      const events = raw ? JSON.parse(raw) as LogroEvent[] : []
      pendingEvents.value = events.length
      return events
    } catch {
      pendingEvents.value = 0
      return [] as LogroEvent[]
    }
  }

  const writePending = (events: LogroEvent[]) => {
    pendingEvents.value = events.length
    if (!import.meta.client) return
    if (!events.length) localStorage.removeItem(queueKey)
    else localStorage.setItem(queueKey, JSON.stringify(events))
  }

  const flushPending = async () => {
    const pending = readPending()
    const remaining: LogroEvent[] = []
    for (const event of pending) {
      try {
        await $fetch('/api/logros', { method: 'POST', body: event })
      } catch {
        remaining.push(event)
      }
    }
    writePending(remaining)
    if (remaining.length !== pending.length) void refreshFromServer()
  }

  const award = async (studentId: string, category: LogroCategory) => {
    const event = awardLocal(studentId, category)
    try {
      await $fetch('/api/logros', { method: 'POST', body: event })
      void flushPending()
      void refreshFromServer()
    } catch {
      writePending([...readPending(), event])
    }
    return event
  }

  const rankings = computed(() => {
    const list = students.value.map((student) => ({ student, state: states.value[student.id] || defaultState(student.id) }))
    const maxStreak = (state: StudentLogrosState) => Math.max(0, ...Object.values(state.streaks || {}).map((value) => Number(value || 0)))
    const topLogros = [...list].filter((entry) => entry.state.pointsThisWeek > 0).sort((a, b) => b.state.pointsThisWeek - a.state.pointsThisWeek).slice(0, 5)
    const bestStreak = [...list].filter((entry) => maxStreak(entry.state) > 0).sort((a, b) => maxStreak(b.state) - maxStreak(a.state)).slice(0, 5)
    const masParticipativo = [...list].filter((entry) => (entry.state.categoryPoints['Participación'] || 0) > 0).sort((a, b) => (b.state.categoryPoints['Participación'] || 0) - (a.state.categoryPoints['Participación'] || 0)).slice(0, 5)
    const mejorActitud = [...list].filter((entry) => (entry.state.categoryPoints['Buena actitud'] || 0) > 0).sort((a, b) => (b.state.categoryPoints['Buena actitud'] || 0) - (a.state.categoryPoints['Buena actitud'] || 0)).slice(0, 5)
    const mayorAvance = [...list].filter((entry) => entry.state.recent.length > 0).sort((a, b) => b.state.recent.length - a.state.recent.length).slice(0, 5)
    return { topLogros, bestStreak, masParticipativo, mejorActitud, mayorAvance }
  })

  watch([students, key], load, { immediate: true, deep: true })
  watch(key, () => { readPending() }, { immediate: true })

  if (import.meta.client) {
    window.addEventListener('online', () => { void flushPending() })
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void flushPending()
    })
  }

  return { states, syncing, pendingEvents, featuredCategory, award, rankings, logroCategories, refreshFromServer, mergeServerStates, flushPending }
}
