import dayjs from 'dayjs'
import type {
  AttendanceRecord,
  AttendanceStatus,
  AttendanceSubmission,
  ClassLogrosSummary,
  GroupMeta,
  LogroCategory,
  RetardoRecord,
  Student,
  WeeklyAttendanceSummary
} from '~/types/domain'
import {
  buildWeeklyDisplayDays,
  getAttendanceTotals,
  getClassCode,
  getGradeDisplay,
  getLogrosClassCopy,
  normalizeStudentName,
  statusToLegacy,
  summarizeLogroState
} from '~/utils/attendanceDisplay'

export const useAttendanceScreen = () => {
  const route = useRoute()
  const plantel = computed(() => String(route.params.plantel || '').toUpperCase())
  const grado = computed(() => decodeURIComponent(String(route.params.grado || '')).toLowerCase())
  const grupo = computed(() => decodeURIComponent(String(route.params.grupo || '')).toUpperCase())
  const mode = ref<'attendance' | 'logros'>('attendance')
  const searchTerm = ref('')
  const selectedDate = ref(dayjs().format('YYYY-MM-DD'))

  const { rememberGroup } = usePlantelMemory()
  const { readRosterCache, writeRosterCache, mergeStudents } = useRosterCache()
  const { createOperationId } = useOperationId()
  const { pendingCount, enqueue, remove, flush } = useAttendanceQueue()
  const status = useTeacherSafeStatus()
  const sounds = useSounds()

  const students = ref<Student[]>([])
  const attendance = ref<Record<string, AttendanceStatus>>({})
  const rosterVersion = ref<string | undefined>()
  const groupMeta = ref<GroupMeta | null>(null)
  const weeklySummary = ref<WeeklyAttendanceSummary | null>(null)
  const serverLogrosSummary = ref<ClassLogrosSummary | null>(null)
  const retardos = ref<Record<string, RetardoRecord>>({})
  const retardosAvailable = ref(false)
  const summaryVisible = ref(false)
  const refreshing = ref(false)
  const initialRosterLoad = ref(true)
  const usedCachedRoster = ref(false)
  const recentlyChangedStudentId = ref<string | null>(null)
  let selectionTimer: ReturnType<typeof setTimeout> | null = null

  const rosterReady = computed(() => students.value.length > 0)
  const showRosterSkeleton = computed(() => initialRosterLoad.value && !students.value.length)
  const plantelRef = computed(() => plantel.value)
  const gradoRef = computed(() => grado.value)
  const grupoRef = computed(() => grupo.value)
  const logros = useLogrosContext(plantelRef, gradoRef, grupoRef, students)

  const attendanceDraftKey = computed(() => `lista-de-caritas:attendance-draft:${plantel.value}:${grado.value}:${grupo.value}:${selectedDate.value}`)
  const retardosCacheKey = computed(() => `lista-de-caritas:retardos:${plantel.value}:${grado.value}:${grupo.value}:${selectedDate.value}`)
  const draftHydrated = ref(false)
  const todayLabel = computed(() => dayjs(selectedDate.value).format('D MMM YYYY').toLowerCase())
  const gradeDisplay = computed(() => getGradeDisplay(grado.value))
  const groupTitle = computed(() => `${gradeDisplay.value} · ${grupo.value}`)
  const classCode = computed(() => groupMeta.value?.code || getClassCode(plantel.value, gradeDisplay.value, grupo.value))
  const classDetail = computed(() => [groupMeta.value?.turn, groupMeta.value?.source].filter(Boolean).join(' · '))
  const totals = computed(() => getAttendanceTotals(students.value, attendance.value))
  const pendingExceptionCount = computed(() => totals.value.faltas + totals.value.enfermedad)
  const studentCountLabel = computed(() => rosterReady.value ? String(students.value.length) : '—')
  const activeLogrosStudents = computed(() => Object.values(logros.states.value || {}).filter((state) => (state.pointsThisWeek || 0) > 0).length)
  const logroSummary = computed(() => summarizeLogroState(logros.states.value || {}, serverLogrosSummary.value, logros.featuredCategory.value))
  const displayWeeklyDays = computed(() => buildWeeklyDisplayDays(selectedDate.value, weeklySummary.value, attendance.value))
  const logrosClassCopy = computed(() => getLogrosClassCopy(weeklySummary.value, logroSummary.value))
  const logrosClassHeadline = computed(() => logrosClassCopy.value.headline)
  const logrosClassLine = computed(() => logrosClassCopy.value.line)

  const readAttendanceDraft = () => {
    if (!import.meta.client) return null
    try {
      const raw = localStorage.getItem(attendanceDraftKey.value)
      if (!raw) return null
      const parsed = JSON.parse(raw) as { attendance?: Record<string, AttendanceStatus> }
      return parsed.attendance || null
    } catch {
      return null
    }
  }

  const writeAttendanceDraft = () => {
    if (!import.meta.client || !draftHydrated.value) return
    localStorage.setItem(attendanceDraftKey.value, JSON.stringify({
      plantel: plantel.value,
      grado: grado.value,
      grupo: grupo.value,
      attendance: attendance.value,
      savedAt: new Date().toISOString()
    }))
  }

  const clearAttendanceDraft = () => {
    if (!import.meta.client) return
    localStorage.removeItem(attendanceDraftKey.value)
  }

  const applyLocalDraft = () => {
    const draft = readAttendanceDraft()
    if (!draft) return
    const studentIds = new Set(students.value.map((student) => student.id))
    const scopedDraft = Object.fromEntries(Object.entries(draft).filter(([studentId]) => studentIds.has(studentId)))
    if (Object.keys(scopedDraft).length) attendance.value = { ...attendance.value, ...scopedDraft }
  }

  const visibleStudents = computed(() => {
    const needle = searchTerm.value.trim().toLowerCase()
    if (!needle) return students.value
    return students.value.filter((student) => {
      const normalizedName = normalizeStudentName(student.nombre)
      const normalizedNeedle = normalizeStudentName(needle)
      return normalizedName.includes(normalizedNeedle) || String(student.matricula || '').includes(needle)
    })
  })


  const clearSelectionTimer = () => {
    if (!selectionTimer) return
    clearTimeout(selectionTimer)
    selectionTimer = null
  }

  const setTransientSelection = (studentId: string, delayMs: number) => {
    recentlyChangedStudentId.value = studentId
    clearSelectionTimer()
    selectionTimer = setTimeout(() => { recentlyChangedStudentId.value = null }, delayMs)
  }

  const setStatus = (studentId: string, nextStatus: AttendanceStatus) => {
    attendance.value = { ...attendance.value, [studentId]: nextStatus }
    setTransientSelection(studentId, 520)
    if (nextStatus === 'present') sounds.play('present')
    if (nextStatus === 'absent') sounds.play('absent')
    if (nextStatus === 'sick') sounds.play('sick')
  }

  const markAllPresent = () => {
    const next = { ...attendance.value }
    for (const student of students.value) next[student.id] = 'present'
    attendance.value = next
    sounds.play('present')
    setTransientSelection('all', 650)
  }

  const applyToday = (records: Array<{ studentId?: string; nombre?: string; status: AttendanceStatus }>) => {
    const next = { ...attendance.value }
    const byName = new Map(students.value.map((student) => [normalizeStudentName(student.nombre), student.id]))
    for (const record of records) {
      const studentId = record.studentId || byName.get(normalizeStudentName(record.nombre))
      if (!studentId) continue
      if (!next[studentId] || next[studentId] === 'unmarked') next[studentId] = record.status
    }
    attendance.value = next
  }

  const normalizeStudents = (incoming: Student[]) => incoming.map((student) => ({
    ...student,
    plantel: student.plantel || plantel.value,
    grado: student.grado || grado.value,
    grupo: student.grupo || grupo.value
  }))

  const loadCachedRoster = () => {
    const cached = readRosterCache(plantel.value, grado.value, grupo.value)
    if (!cached?.students?.length) return
    usedCachedRoster.value = true
    students.value = normalizeStudents(cached.students)
    rosterVersion.value = cached.version
    groupMeta.value = cached.meta || groupMeta.value
    for (const student of students.value) attendance.value[student.id] ||= 'unmarked'
    applyLocalDraft()
  }

  const refreshRoster = async () => {
    refreshing.value = true
    try {
      const fresh = await $fetch<{ students: Student[]; version?: string; meta?: GroupMeta }>(`/api/planteles/${plantel.value}/grupos/${encodeURIComponent(grado.value)}/${encodeURIComponent(grupo.value)}/roster`)
      const normalized = normalizeStudents(fresh.students || [])
      students.value = mergeStudents(students.value, normalized)
      rosterVersion.value = fresh.version
      groupMeta.value = fresh.meta || groupMeta.value
      for (const student of students.value) attendance.value[student.id] ||= 'unmarked'
      applyLocalDraft()
      writeRosterCache(plantel.value, grado.value, grupo.value, students.value, fresh.version, fresh.meta)
    } catch {
      // Teacher-facing UI stays calm. Details are logged on the server route.
    } finally {
      refreshing.value = false
      initialRosterLoad.value = false
    }
  }

  const refreshToday = async () => {
    try {
      const today = await $fetch<{ records: Array<{ studentId?: string; nombre?: string; status: AttendanceStatus }> }>(`/api/planteles/${plantel.value}/grupos/${encodeURIComponent(grado.value)}/${encodeURIComponent(grupo.value)}/asistencia-hoy?date=${selectedDate.value}`)
      applyToday(today.records || [])
      applyLocalDraft()
    } catch {
      // Teacher-facing UI stays calm. Details are logged on the server route.
    }
  }

  const refreshWeeklySummary = async () => {
    try {
      weeklySummary.value = await $fetch<WeeklyAttendanceSummary>(`/api/planteles/${plantel.value}/grupos/${encodeURIComponent(grado.value)}/${encodeURIComponent(grupo.value)}/resumen-semanal?date=${selectedDate.value}`)
    } catch {
      weeklySummary.value = null
    }
  }

  const readRetardosCache = () => {
    if (!import.meta.client) return
    try {
      const raw = localStorage.getItem(retardosCacheKey.value)
      if (!raw) return
      const parsed = JSON.parse(raw) as { available?: boolean; records?: RetardoRecord[] }
      retardosAvailable.value = Boolean(parsed.available)
      retardos.value = Object.fromEntries((parsed.records || []).map((record) => [record.studentId, record]))
    } catch {
      // Cached tardies are an enhancement only.
    }
  }

  const writeRetardosCache = (available: boolean, records: RetardoRecord[]) => {
    if (!import.meta.client) return
    localStorage.setItem(retardosCacheKey.value, JSON.stringify({ available, records, savedAt: new Date().toISOString() }))
  }

  const refreshRetardos = async () => {
    if (!students.value.length) return
    try {
      const result = await $fetch<{ available: boolean; records: RetardoRecord[] }>(`/api/planteles/${plantel.value}/grupos/${encodeURIComponent(grado.value)}/${encodeURIComponent(grupo.value)}/retardos?date=${selectedDate.value}`)
      retardosAvailable.value = Boolean(result.available)
      retardos.value = Object.fromEntries((result.records || []).map((record) => [record.studentId, record]))
      writeRetardosCache(Boolean(result.available), result.records || [])
    } catch {
      // Retardos are background context only; attendance remains usable.
    }
  }

  const refreshLogrosSummary = async () => {
    try {
      serverLogrosSummary.value = await $fetch<ClassLogrosSummary>(`/api/planteles/${plantel.value}/grupos/${encodeURIComponent(grado.value)}/${encodeURIComponent(grupo.value)}/logros-resumen`)
    } catch {
      serverLogrosSummary.value = null
    }
  }

  const refreshLogrosState = async () => {
    await logros.refreshFromServer()
    await refreshLogrosSummary()
  }

  const setMode = (nextMode: 'attendance' | 'logros') => {
    mode.value = nextMode
    if (nextMode === 'logros') void refreshLogrosState()
  }

  const buildSubmission = (): AttendanceSubmission => {
    const records: AttendanceRecord[] = students.value.map((student) => {
      const current = attendance.value[student.id] || 'unmarked'
      const legacy = statusToLegacy(current)
      return {
        studentId: student.id,
        nombre: student.nombre,
        status: current,
        modalidad: legacy.modalidad,
        attendance: legacy.attendance
      }
    })
    return {
      operationId: createOperationId('attendance'),
      plantel: plantel.value,
      grado: grado.value,
      grupo: grupo.value,
      submittedAt: new Date().toISOString(),
      attendanceDate: selectedDate.value,
      records,
      clientSummary: totals.value
    }
  }

  const saveAttendance = async () => {
    if (!students.value.length) return
    const submission = buildSubmission()
    enqueue(submission)
    status.setSaving()
    try {
      await $fetch('/api/asistencia', { method: 'POST', body: submission })
      remove(submission.operationId)
      await flush()
      clearAttendanceDraft()
      status.setReady()
      sounds.play('save')
      window.setTimeout(() => sounds.play('complete'), 120)
      summaryVisible.value = true
      void refreshWeeklySummary()
      void refreshLogrosState()
    } catch {
      status.setPending()
    }
  }

  const awardLogro = async (studentId: string, category: LogroCategory) => {
    const event = await logros.award(studentId, category)
    if (event.weeklyMilestoneBonus) sounds.play('milestone')
    else if (event.streakBonus) sounds.play('streak')
    else sounds.play('logro')
    void refreshLogrosState()
  }

  watch([plantel, grado, grupo], () => {
    rememberGroup(plantel.value, grado.value, grupo.value)
  }, { immediate: true })

  watch(attendance, () => writeAttendanceDraft(), { deep: true })

  onMounted(() => {
    draftHydrated.value = true
    loadCachedRoster()
    if (students.value.length) initialRosterLoad.value = false
    void flush()
    readRetardosCache()
    void refreshRoster()
      .then(() => refreshToday())
      .then(() => refreshRetardos())
      .then(() => refreshWeeklySummary())
      .then(() => refreshLogrosState())
  })

  onBeforeUnmount(() => clearSelectionTimer())

  return {
    activeLogrosStudents,
    attendance,
    awardLogro,
    classCode,
    classDetail,
    displayWeeklyDays,
    grado,
    grupo,
    groupTitle,
    logros,
    logrosClassHeadline,
    logrosClassLine,
    logroSummary,
    markAllPresent,
    mode,
    pendingCount,
    pendingExceptionCount,
    plantel,
    recentlyChangedStudentId,
    refreshRoster,
    refreshing,
    retardos,
    rosterReady,
    saveAttendance,
    searchTerm,
    setMode,
    setStatus,
    showRosterSkeleton,
    sounds,
    status,
    studentCountLabel,
    students,
    summaryVisible,
    todayLabel,
    totals,
    visibleStudents
  }
}
