<script setup lang="ts">
import dayjs from 'dayjs'
import { ArrowLeft, CalendarDays, CheckCircle2, CheckSquare, ClipboardCheck, Filter, List, MoreHorizontal, Pencil, RefreshCcw, Search, Shuffle, Star, Thermometer, Trophy, UserRoundX, Users } from 'lucide-vue-next'
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
    <header class="attendance-topbar">
      <div class="topbar-left">
        <NuxtLink class="round-button back" :to="`/asistencia/${plantel}?cambiar=grupo`" aria-label="Cambiar grupo">
          <ArrowLeft class="icon" />
        </NuxtLink>
        <span class="round-button soft"><ClipboardCheck class="icon" /></span>
        <div class="attendance-title">
          <h1>Pase de lista <span aria-hidden="true">🌿</span></h1>
          <small>lista-de-caritas app</small>
        </div>
      </div>
      <div class="topbar-actions">
        <button class="date-pill" type="button"><CalendarDays class="icon-sm" /> {{ todayLabel }}</button>
        <button class="round-button soft" type="button" aria-label="Más"><MoreHorizontal class="icon" /></button>
        <NuxtLink class="change-group-pill" :to="`/asistencia/${plantel}?cambiar=grupo`"><Shuffle class="icon-sm" /> Cambiar grupo</NuxtLink>
      </div>
    </header>

    <div class="attendance-layout">
      <section class="attendance-main">
        <section class="class-hero-card">
          <div class="hero-badge">
            <span class="badge-aura" aria-hidden="true" />
            <span class="laurel laurel-left" aria-hidden="true" />
            <span class="laurel laurel-right" aria-hidden="true" />
            <div class="shield"><span class="shield-shine" aria-hidden="true" /><GroupIcon :label="grupo" tone="green" /></div>
            <span class="medal"><Star class="icon-sm" /></span>
          </div>
          <div class="hero-copy">
            <h2>{{ groupTitle }}</h2>
            <p class="hero-meta"><span>{{ classCode }}</span><template v-if="classDetail"><i>•</i> {{ classDetail }}</template></p>
            <p class="hero-roster-meta"><Users class="icon-sm" /> {{ studentCountLabel }} alumnos</p>
          </div>
          <GroupIcon :label="grupo" tone="green" decorative />
          <div class="hero-sparkles" aria-hidden="true" />
        </section>

        <AttendanceSummaryCards :presentes="totals.presentes" :faltas="totals.faltas" :enfermedad="totals.enfermedad" :total="totals.total" />

        <nav class="class-mode-switcher" aria-label="Modo de trabajo">
          <button type="button" :class="{ active: mode === 'attendance' }" @click="setMode('attendance')">
            <ClipboardCheck class="icon-sm" /> Asistencia
          </button>
          <button type="button" class="logros-tab" :class="{ active: mode === 'logros' }" @click="setMode('logros')">
            <Trophy class="icon-sm" /> Logros
            <span v-if="activeLogrosStudents" class="mode-count">{{ activeLogrosStudents }}</span>
          </button>
        </nav>

        <section v-if="mode === 'attendance'" class="attendance-controls" aria-label="Herramientas de asistencia">
          <div class="mode-segments">
            <button :class="{ active: viewMode === 'exceptions' }" type="button" @click="setViewMode('exceptions')" :aria-pressed="viewMode === 'exceptions'"><Star class="icon-sm" /> Solo excepciones</button>
            <button :class="{ active: viewMode === 'one' }" type="button" @click="setViewMode('one')" :aria-pressed="viewMode === 'one'"><Pencil class="icon-sm" /> Uno por uno</button>
            <button :class="{ active: viewMode === 'compact' }" type="button" @click="setViewMode('compact')" :aria-pressed="viewMode === 'compact'"><List class="icon-sm" /> Compacta</button>
          </div>
          <div class="search-row">
            <label class="search-box"><Search class="icon" /><input v-model="searchTerm" type="search" placeholder="Buscar alumno..."></label>
            <button class="filter-button" type="button"><Filter class="icon" /> Filtros</button>
          </div>
          <div class="quick-actions">
            <button class="mark-all-button" type="button" :disabled="!rosterReady" @click="markAllPresent"><CheckSquare class="icon-sm" /> Marcar todos presentes</button>
            <button class="quiet-button" type="button" aria-label="Actualizar lista" @click="refreshRoster"><RefreshCcw class="icon-sm" :class="{ 'spin-soft': refreshing }" /></button>
            <SoundToggle :enabled="sounds.enabled.value" @toggle="sounds.setEnabled(!sounds.enabled.value)" />
          </div>
          <div v-if="pendingCount" class="safe-note compact">Pendiente de guardar</div>
          <div v-else-if="refreshing" class="sync-strip"><span class="sync-dot" /> Sincronizando</div>
        </section>

        <section v-if="mode === 'attendance'" class="roster-grid reference-density" :class="`view-${viewMode}`" aria-label="Lista de alumnos">
          <StudentAttendanceCard
            v-for="(student, index) in visibleStudents"
            :key="student.id"
            :student="student"
            :index="index + 1"
            :status="attendance[student.id] || 'unmarked'"
            :highlighted="recentlyChangedStudentId === student.id || recentlyChangedStudentId === 'all'"
            :retardo="retardos[student.id]"
            :interaction-mode="cardInteractionMode"
            @set-status="setStatus"
          />
          <template v-if="showRosterSkeleton">
            <article v-for="index in 10" :key="`skeleton-${index}`" class="student-card skeleton-card" aria-hidden="true">
              <div class="student-main-button">
                <span class="rank-bubble">{{ index }}</span>
                <span class="student-avatar-ring skeleton-avatar" />
                <span class="student-info"><span class="skeleton-line wide" /><span class="skeleton-line short" /><span class="skeleton-pill" /></span>
              </div>
            </article>
          </template>
          <div v-if="!students.length && !showRosterSkeleton" class="empty-state"><strong>Lista en preparación</strong></div>
        </section>

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

      <aside class="attendance-sidebar" aria-label="Resumen">
        <section class="side-card save-side-card">
          <div class="pending-badge"><Star class="icon" /></div>
          <div>
            <h3>{{ pendingExceptionCount || pendingCount }} cambios pendientes</h3>
            <p><b class="danger">{{ totals.faltas }} faltas</b> <i>•</i> <b class="info">{{ totals.enfermedad }} enfermo</b></p>
          </div>
          <button class="primary-button save-button desktop" type="button" :disabled="totals.total === 0" @click="saveAttendance">Guardar pase de lista</button>
          <small class="ready-line">{{ status.label.value }}</small>
        </section>

        <section class="side-card group-info-card">
          <h3>Información del grupo</h3>
          <p><GroupIcon :label="grupo" tone="green" /> {{ groupTitle }}</p>
          <p><span>{{ classCode }}</span><template v-if="classDetail"><i>•</i>{{ classDetail }}</template></p>
          <p><Users class="icon-sm" /> {{ studentCountLabel }} alumnos</p>
        </section>

        <section class="side-card weekly-real-card">
          <h3><CalendarDays class="icon-sm" /> Resumen semanal</h3>
          <div class="weekly-grid restored-weekly-grid">
            <span />
            <strong v-for="day in displayWeeklyDays" :key="`h-${day.date}`" :class="{ today: day.isToday }">{{ day.label }}<small>{{ day.shortLabel }}</small></strong>
            <span class="week-status-icon present"><CheckCircle2 class="icon-sm" /></span><b v-for="day in displayWeeklyDays" :key="`p-${day.date}`" :class="{ today: day.isToday }">{{ day.total ? day.presentes : '–' }}</b>
            <span class="week-status-icon absent"><UserRoundX class="icon-sm" /></span><b v-for="day in displayWeeklyDays" :key="`a-${day.date}`" :class="{ today: day.isToday }">{{ day.total ? day.faltas : '–' }}</b>
            <span class="week-status-icon sick"><Thermometer class="icon-sm" /></span><b v-for="day in displayWeeklyDays" :key="`s-${day.date}`" :class="{ today: day.isToday }">{{ day.total ? day.enfermedad : '–' }}</b>
          </div>
        </section>

        <section class="side-card logros-real-card restored-logros-card">
          <h3><Trophy class="icon-sm" /> Logros de la clase</h3>
          <div class="logros-celebration-body">
            <span class="logros-star-medal" aria-hidden="true"><Star class="icon" /></span>
            <div class="logros-celebration-copy">
              <strong>{{ logrosClassHeadline }}</strong>
              <p>{{ logrosClassLine }}</p>
              <button class="open-logros-button" type="button" @click="setMode('logros')">Abrir Logros</button>
            </div>
            <div class="logros-group-mascot" aria-hidden="true">
              <GroupIcon :label="grupo" tone="green" decorative />
            </div>
          </div>
        </section>
      </aside>
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

    <FixedSaveBar :label="status.label.value" :pending-count="pendingCount" :faltas="totals.faltas" :enfermedad="totals.enfermedad" :total="totals.total" @save="saveAttendance" />
    <ModeFooter :mode="mode" :pending-attendance="pendingCount > 0" @change="setMode" />
  </main>
</template>
