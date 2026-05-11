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

export const logroStreakNames = {
  participation: 'Racha de participación',
  attitude: 'Racha de buena actitud',
  completedWork: 'Racha de trabajo completo'
} as const

export const logroStreakNameList = Object.values(logroStreakNames)

const streakCategories: Partial<Record<LogroCategory, string>> = {
  'Participación': logroStreakNames.participation,
  'Buena actitud': logroStreakNames.attitude,
  'Trabajo completo': logroStreakNames.completedWork
}

const defaultStreaks = () => Object.fromEntries(
  logroStreakNameList.map((name) => [name, 0])
) as Record<string, number>

const normalizeStreaks = (...sources: Array<Record<string, number> | undefined>) => {
  const clean = defaultStreaks()
  for (const source of sources) {
    for (const name of logroStreakNameList) {
      clean[name] = Math.max(clean[name] || 0, Number(source?.[name] || 0))
    }
  }
  return clean
}

const recognitionStreakEntries = (state: StudentLogrosState) => logroStreakNameList
  .map((name) => Number(state.streaks?.[name] || 0))

const maxRecognitionStreakValue = (state: StudentLogrosState) => Math.max(0, ...recognitionStreakEntries(state))

const consecutiveCalendarDaysFromLatest = (dates: Iterable<string>) => {
  const sorted = [...new Set(dates)]
    .filter(Boolean)
    .sort((a, b) => dayjs(b).valueOf() - dayjs(a).valueOf())

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

const categoryStreakAfterAward = (state: StudentLogrosState, category: LogroCategory, awardedAt: string) => {
  const dates = new Set(
    (state.recent || [])
      .filter((entry) => entry.category === category)
      .map((entry) => dayjs(entry.awardedAt).format('YYYY-MM-DD'))
  )
  dates.add(dayjs(awardedAt).format('YYYY-MM-DD'))
  return consecutiveCalendarDaysFromLatest(dates)
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
    streaks: defaultStreaks(),
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
      streaks: normalizeStreaks(input?.streaks),
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
        streaks: normalizeStreaks(serverState.streaks, localState.streaks),
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
      // Local optimistic state stays usable; technical details stay server-side.
    } finally {
      syncing.value = false
    }
  }

  const awardLocal = (studentId: string, category: LogroCategory) => {
    const state = normalizeState(studentId, states.value[studentId])
    const featured = category === featuredCategory.value
    const currentCategoryPoints = state.categoryPoints[category] || 0
    const pointsBefore = state.pointsThisWeek
    const normalPoints = featured ? 2 : 1
    const awardedAt = new Date().toISOString()
    const streakName = streakCategories[category]
    const nextStreak = streakName ? Math.max(Number(state.streaks[streakName] || 0), categoryStreakAfterAward(state, category, awardedAt)) : 0
    const streakBonus = streakName && nextStreak >= 3 ? 1 : 0
    const weeklyMilestoneBonus = Math.floor((pointsBefore + normalPoints + streakBonus) / 10) > Math.floor(pointsBefore / 10) ? 3 : 0
    const totalPoints = normalPoints + streakBonus + weeklyMilestoneBonus

    state.pointsThisWeek += totalPoints
    state.categoryPoints[category] = currentCategoryPoints + normalPoints
    state.recent = [{ category, points: totalPoints, awardedAt }, ...state.recent].slice(0, 8)
    if (streakName) state.streaks[streakName] = nextStreak

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
      awardedAt
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

  const sendEvent = async (event: LogroEvent) => {
    const saved = await $fetch<{ streakBonus?: number; weeklyMilestoneBonus?: number }>('/api/logros', { method: 'POST', body: event })
    if (saved) {
      event.streakBonus = Number(saved.streakBonus || 0)
      event.weeklyMilestoneBonus = Number(saved.weeklyMilestoneBonus || 0)
    }
    return event
  }

  const award = async (studentId: string, category: LogroCategory) => {
    const event = awardLocal(studentId, category)
    try {
      await sendEvent(event)
      void flushPending()
      void refreshFromServer()
    } catch {
      writePending([...readPending(), event])
    }
    return event
  }

  const awardBatch = async (studentIds: string[], category: LogroCategory) => {
    const uniqueIds = [...new Set(studentIds.filter(Boolean))]
    const events = uniqueIds.map((studentId) => awardLocal(studentId, category))
    const failed: LogroEvent[] = []

    for (const event of events) {
      try {
        await sendEvent(event)
      } catch {
        failed.push(event)
      }
    }

    if (failed.length) writePending([...readPending(), ...failed])
    if (events.length !== failed.length) {
      void flushPending()
      void refreshFromServer()
    }

    return { events, saved: events.length - failed.length, failed: failed.length }
  }

  const rankings = computed(() => {
    const list = students.value.map((student) => ({ student, state: states.value[student.id] || defaultState(student.id) }))
    const topLogros = [...list].filter((entry) => entry.state.pointsThisWeek > 0).sort((a, b) => b.state.pointsThisWeek - a.state.pointsThisWeek).slice(0, 5)
    const bestStreak = [...list].filter((entry) => maxRecognitionStreakValue(entry.state) > 0).sort((a, b) => maxRecognitionStreakValue(b.state) - maxRecognitionStreakValue(a.state)).slice(0, 5)
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

  return { states, syncing, pendingEvents, featuredCategory, award, awardBatch, rankings, logroCategories, refreshFromServer, mergeServerStates, flushPending }
}
