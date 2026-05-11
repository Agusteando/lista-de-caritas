<script setup lang="ts">
import dayjs from 'dayjs'
import type { AttendanceRecord, AttendanceStatus, AttendanceSubmission, ClassLogrosSummary, GroupMeta, LogroCategory, RetardoRecord, Student, WeeklyAttendanceSummary } from '~/types/domain'

const route = useRoute()
const plantel = computed(() => String(route.params.plantel || '').toUpperCase())
const grado = computed(() => decodeURIComponent(String(route.params.grado || '')).toLowerCase())
const grupo = computed(() => decodeURIComponent(String(route.params.grupo || '')).toUpperCase())
const mode = ref<'attendance' | 'logros'>('attendance')
const viewMode = ref<'exceptions' | 'one' | 'compact'>('exceptions')
const viewModeStorageKey = computed(() => `lista-de-caritas:view-mode:${plantel.value}:${grado.value}:${grupo.value}`)
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
let selectionTimer: ReturnType<typeof window.setTimeout> | null = null
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
const gradeDisplay = computed(() => grado.value.replace(/^\w/, (c) => c.toUpperCase()))
const groupTitle = computed(() => `${gradeDisplay.value} · ${grupo.value}`)
const classCode = computed(() => groupMeta.value?.code || `${plantel.value}-${gradeDisplay.value}-${grupo.value}`.replace(/\s+/g, '-').toUpperCase())
const classDetail = computed(() => [groupMeta.value?.turn, groupMeta.value?.source].filter(Boolean).join(' · '))
const pendingExceptionCount = computed(() => totals.value.faltas + totals.value.enfermedad)
const studentCountLabel = computed(() => rosterReady.value ? String(students.value.length) : '—')
const activeLogrosStudents = computed(() => Object.values(logros.states.value || {}).filter((state) => (state.pointsThisWeek || 0) > 0).length)
const logroSummary = computed(() => {
  const stateList = Object.values(logros.states.value || {})
  const local = {
    totalPoints: stateList.reduce((sum, state) => sum + (state.pointsThisWeek || 0), 0),
    totalEvents: stateList.reduce((sum, state) => sum + (state.recent?.length || 0), 0),
    activeStudents: stateList.filter((state) => (state.pointsThisWeek || 0) > 0).length
  }
  const server = serverLogrosSummary.value
  return {
    totalPoints: Math.max(local.totalPoints, server?.totalPoints || 0),
    totalEvents: Math.max(local.totalEvents, server?.totalEvents || 0),
    activeStudents: Math.max(local.activeStudents, server?.activeStudents || 0),
    topCategory: server?.topCategory || logros.featuredCategory.value
  }
})
const weekDayLabels = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']
const displayWeeklyDays = computed(() => {
  const selected = dayjs(selectedDate.value)
  const weekStart = selected.subtract((selected.day() + 6) % 7, 'day').startOf('day')
  const baseDays = weeklySummary.value?.days?.length
    ? weeklySummary.value.days
    : Array.from({ length: 5 }, (_, index) => {
        const date = weekStart.add(index, 'day')
        return {
          date: date.format('YYYY-MM-DD'),
          label: weekDayLabels[date.day()],
          shortLabel: date.format('D'),
          presentes: 0,
          faltas: 0,
          enfermedad: 0,
          total: 0,
          isToday: date.isSame(selected, 'day')
        }
      })

  const values = Object.values(attendance.value)
  const liveCounts = {
    presentes: values.filter((value) => value === 'present').length,
    faltas: values.filter((value) => value === 'absent').length,
    enfermedad: values.filter((value) => value === 'sick').length
  }
  const liveTotal = liveCounts.presentes + liveCounts.faltas + liveCounts.enfermedad

  return baseDays.map((day) => {
    const isSelected = day.date === selectedDate.value
    if (!isSelected || liveTotal === 0) return { ...day, isToday: isSelected }
    return {
      ...day,
      ...liveCounts,
      total: liveTotal,
      isToday: true,
      isPreview: true
    }
  })
})
const logrosClassHeadline = computed(() => {
  const weeks = weeklySummary.value?.positiveWeekStreak || 0
  if (weeks >= 1) return '¡Sigan así!'
  if (logroSummary.value.totalEvents > 0) return '¡Buen avance!'
  if (weeklySummary.value?.hasAnyAttendanceData) return 'Clase en movimiento'
  return 'Semana en curso'
})
const logrosClassLine = computed(() => {
  const weeks = weeklySummary.value?.positiveWeekStreak || 0
  if (weeks > 1) return `Van ${weeks} semanas con más presentes que faltas.`
  if (weeks === 1) return 'Esta semana va con más presentes que faltas.'
  if (logroSummary.value.totalEvents > 0) {
    const events = logroSummary.value.totalEvents
    const points = logroSummary.value.totalPoints
    return `${events} ${events === 1 ? 'logro registrado' : 'logros registrados'} · ${points} ${points === 1 ? 'punto' : 'puntos'} esta semana.`
  }
  if (weeklySummary.value?.hasAnyAttendanceData) return 'El resumen refleja los registros guardados de la semana.'
  return 'Los avances aparecerán conforme se guarden asistencia y logros.'
})

const normalizeStudentNameClient = (value: unknown) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .trim()

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

const statusToLegacy = (value: AttendanceStatus) => {
  if (value === 'present') return { modalidad: '1' as const, attendance: 1 as const }
  if (value === 'sick') return { modalidad: '2' as const, attendance: 0 as const }
  if (value === 'absent') return { modalidad: '0' as const, attendance: 0 as const }
  return { modalidad: '9' as const, attendance: 0 as const }
}

const totals = computed(() => {
  const values = Object.values(attendance.value)
  return {
    total: students.value.length,
    presentes: values.filter((value) => value === 'present').length,
    faltas: values.filter((value) => value === 'absent').length,
    enfermedad: values.filter((value) => value === 'sick').length,
    sinMarcar: students.value.length - values.filter((value) => value !== 'unmarked').length
  }
})

const visibleStudents = computed(() => {
  const needle = searchTerm.value.trim().toLowerCase()
  if (!needle) return students.value
  return students.value.filter((student) => {
    const normalizedName = normalizeStudentNameClient(student.nombre)
    const normalizedNeedle = normalizeStudentNameClient(needle)
    return normalizedName.includes(normalizedNeedle) || String(student.matricula || '').includes(needle)
  })
})

const cardInteractionMode = computed<'exceptions' | 'one'>(() => viewMode.value === 'exceptions' ? 'exceptions' : 'one')

const setViewMode = (nextMode: 'exceptions' | 'one' | 'compact') => {
  if (viewMode.value === nextMode) return
  viewMode.value = nextMode
  if (import.meta.client) localStorage.setItem(viewModeStorageKey.value, nextMode)
}

const setStatus = (studentId: string, nextStatus: AttendanceStatus) => {
  attendance.value = { ...attendance.value, [studentId]: nextStatus }
  recentlyChangedStudentId.value = studentId
  if (selectionTimer) window.clearTimeout(selectionTimer)
  selectionTimer = window.setTimeout(() => { recentlyChangedStudentId.value = null }, 520)
  if (nextStatus === 'present') sounds.play('present')
  if (nextStatus === 'absent') sounds.play('absent')
  if (nextStatus === 'sick') sounds.play('sick')
}

const markAllPresent = () => {
  const next = { ...attendance.value }
  for (const student of students.value) next[student.id] = 'present'
  attendance.value = next
  sounds.play('present')
  recentlyChangedStudentId.value = 'all'
  if (selectionTimer) window.clearTimeout(selectionTimer)
  selectionTimer = window.setTimeout(() => { recentlyChangedStudentId.value = null }, 650)
}

const applyToday = (records: Array<{ studentId?: string; nombre?: string; status: AttendanceStatus }>) => {
  const next = { ...attendance.value }
  const byName = new Map(students.value.map((student) => [normalizeStudentNameClient(student.nombre), student.id]))
  for (const record of records) {
    const studentId = record.studentId || byName.get(normalizeStudentNameClient(record.nombre))
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
  const rememberedViewMode = localStorage.getItem(viewModeStorageKey.value)
  if (rememberedViewMode === 'exceptions' || rememberedViewMode === 'one' || rememberedViewMode === 'compact') viewMode.value = rememberedViewMode
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
</script>

<template>
  <main class="attendance-shell">
    <AttendanceTopbar :plantel="plantel" :today-label="todayLabel" />

    <div class="attendance-layout">
      <section class="attendance-main">
        <ClassHero
          :grupo="grupo"
          :title="groupTitle"
          :class-code="classCode"
          :detail="classDetail"
          :student-count-label="studentCountLabel"
        />

        <AttendanceSummaryCards
          :presentes="totals.presentes"
          :faltas="totals.faltas"
          :enfermedad="totals.enfermedad"
          :total="totals.total"
        />

        <AttendanceWorkflowTabs
          :mode="mode"
          :active-logros-students="activeLogrosStudents"
          @change="setMode"
        />

        <template v-if="mode === 'attendance'">
          <AttendanceViewControls
            v-model:search-term="searchTerm"
            :view-mode="viewMode"
            :roster-ready="rosterReady"
            :pending-count="pendingCount"
            :refreshing="refreshing"
            :sound-enabled="sounds.enabled.value"
            @set-view-mode="setViewMode"
            @mark-all-present="markAllPresent"
            @refresh-roster="refreshRoster"
            @toggle-sound="sounds.setEnabled(!sounds.enabled.value)"
          />

          <AttendanceRoster
            :students="visibleStudents"
            :attendance="attendance"
            :view-mode="viewMode"
            :interaction-mode="cardInteractionMode"
            :show-skeleton="showRosterSkeleton"
            :recently-changed-student-id="recentlyChangedStudentId"
            :retardos="retardos"
            @set-status="setStatus"
          />
        </template>

        <LogrosPanel
          v-else
          :students="students"
          :states="logros.states.value"
          :featured-category="logros.featuredCategory.value"
          :rankings="logros.rankings.value"
          :group-label="grupo"
          :syncing="logros.syncing.value"
          @award="awardLogro"
        />
      </section>

      <AttendanceSidebar
        :pending-changes="pendingExceptionCount"
        :pending-count="pendingCount"
        :totals="totals"
        :status-label="status.label.value"
        :grupo="grupo"
        :title="groupTitle"
        :class-code="classCode"
        :detail="classDetail"
        :student-count-label="studentCountLabel"
        :weekly-days="displayWeeklyDays"
        :logros-headline="logrosClassHeadline"
        :logros-line="logrosClassLine"
        @save="saveAttendance"
        @open-logros="setMode('logros')"
      />
    </div>

    <SummarySheet
      v-if="summaryVisible"
      :presentes="totals.presentes"
      :faltas="totals.faltas"
      :enfermedad="totals.enfermedad"
      :total="totals.total"
      :plantel="plantel"
      :grado="grado"
      :grupo="grupo"
      @close="summaryVisible = false"
    />

    <FixedSaveBar
      :label="status.label.value"
      :pending-count="pendingCount"
      :faltas="totals.faltas"
      :enfermedad="totals.enfermedad"
      :total="totals.total"
      @save="saveAttendance"
    />
    <ModeFooter :mode="mode" :pending-attendance="pendingCount > 0" @change="setMode" />
  </main>
</template>
