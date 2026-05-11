<script setup lang="ts">
import { Award, CheckCircle2, Flame, Medal, RefreshCw, Search, Sparkles, Star, Trophy, UserRound, UsersRound, X } from 'lucide-vue-next'
import { logroCategories } from '~/composables/useLogros'
import type { LogroCategory, Student, StudentLogrosState } from '~/types/domain'

type RankingMode = 'topLogros' | 'bestStreak' | 'masParticipativo' | 'mejorActitud' | 'mayorAvance'
type RankingEntry = { student: Student; state: StudentLogrosState }
type Rankings = Record<RankingMode, RankingEntry[]>

const props = defineProps<{
  students: Student[]
  states: Record<string, StudentLogrosState>
  featuredCategory: LogroCategory
  rankings: Rankings
  groupLabel?: string | null
  syncing?: boolean
  pendingEvents?: number
  totalPoints: number
  totalEvents: number
  activeStudents: number
  topCategory?: LogroCategory | null
}>()

const emit = defineEmits<{
  award: [studentId: string, category: LogroCategory]
  refresh: []
}>()

const rankingMode = ref<RankingMode>('topLogros')
const selectedStudentId = ref<string | null>(null)
const searchTerm = ref('')
const onlyWithLogros = ref(false)
const cardClass = ref<Record<string, boolean>>({})

const categories = computed(() => [
  props.featuredCategory,
  ...logroCategories.filter((category) => category !== props.featuredCategory)
])

const rankingTitle: Record<RankingMode, string> = {
  topLogros: 'Top semanal',
  bestStreak: 'Racha',
  masParticipativo: 'Participación',
  mejorActitud: 'Actitud',
  mayorAvance: 'Avance'
}
const rankingOptions = Object.entries(rankingTitle).map(([value, label]) => ({ value: value as RankingMode, label }))

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

const normalize = (value: unknown) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .trim()

const stateFor = (studentId: string) => props.states[studentId] || defaultState(studentId)
const maxStreak = (state: StudentLogrosState) => Math.max(0, ...Object.values(state.streaks || {}).map((value) => Number(value || 0)))
const categoryPoints = (state: StudentLogrosState, category: LogroCategory) => state.categoryPoints?.[category] || 0
const badgeCount = (state: StudentLogrosState) => state.badges?.length || 0
const bestCategoryLabel = (state: StudentLogrosState) => {
  if (state.bestCategory && categoryPoints(state, state.bestCategory) > 0) return state.bestCategory
  if (state.pointsThisWeek > 0) return 'Semana activa'
  return 'Sin logros'
}

const filteredStudents = computed(() => {
  const needle = normalize(searchTerm.value)
  return props.students.filter((student) => {
    const state = stateFor(student.id)
    if (onlyWithLogros.value && state.pointsThisWeek <= 0) return false
    if (!needle) return true
    return normalize(student.nombre).includes(needle) || String(student.matricula || '').toLowerCase().includes(needle)
  })
})

const selectedStudent = computed(() => {
  if (selectedStudentId.value) {
    const selected = props.students.find((student) => student.id === selectedStudentId.value)
    if (selected) return selected
  }
  return filteredStudents.value[0] || props.students[0] || null
})
const selectedState = computed(() => selectedStudent.value ? stateFor(selectedStudent.value.id) : null)
const selectedRecent = computed(() => selectedState.value?.recent?.slice(0, 5) || [])
const selectedTopCategories = computed(() => {
  if (!selectedState.value) return [] as Array<{ category: LogroCategory; points: number }>
  return logroCategories
    .map((category) => ({ category, points: categoryPoints(selectedState.value as StudentLogrosState, category) }))
    .filter((entry) => entry.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 3)
})
const currentRanking = computed(() => props.rankings[rankingMode.value] || [])
const hasLogros = computed(() => props.totalEvents > 0 || props.totalPoints > 0)

watch(filteredStudents, () => {
  if (!selectedStudentId.value || !filteredStudents.value.some((student) => student.id === selectedStudentId.value)) {
    selectedStudentId.value = filteredStudents.value[0]?.id || props.students[0]?.id || null
  }
}, { immediate: true })

const award = async (studentId: string, category: LogroCategory) => {
  selectedStudentId.value = studentId
  cardClass.value = { ...cardClass.value, [studentId]: true }
  window.setTimeout(() => {
    cardClass.value = { ...cardClass.value, [studentId]: false }
  }, 700)
  emit('award', studentId, category)
}

const clearSearch = () => { searchTerm.value = '' }
</script>

<template>
  <div class="logros-section">
    <section class="logros-command-card">
      <div class="logros-command-copy">
        <span class="hero-eyebrow"><Sparkles class="icon-sm" /> {{ groupLabel || 'Clase' }}</span>
        <h2>Logros</h2>
        <div class="featured-logro"><Medal class="icon-sm" /> {{ featuredCategory }} · +2 hoy</div>
        <div v-if="topCategory" class="top-category-logro"><Trophy class="icon-sm" /> Fuerte: {{ topCategory }}</div>
      </div>

      <div class="logros-command-stats" aria-label="Resumen de logros">
        <article><strong>{{ totalEvents }}</strong><span>logros</span></article>
        <article><strong>{{ totalPoints }}</strong><span>puntos</span></article>
        <article><strong>{{ activeStudents }}</strong><span>activos</span></article>
      </div>

      <div class="logros-toolbar">
        <label class="logros-search-box">
          <Search class="icon-sm" />
          <input v-model="searchTerm" type="search" placeholder="Buscar alumno...">
          <button v-if="searchTerm" type="button" aria-label="Limpiar búsqueda" @click="clearSearch"><X class="icon-xs" /></button>
        </label>
        <button class="logros-filter-chip" :class="{ active: onlyWithLogros }" type="button" @click="onlyWithLogros = !onlyWithLogros">
          <CheckCircle2 class="icon-sm" /> Con logros
        </button>
        <button class="logros-refresh-button" type="button" :disabled="syncing" @click="emit('refresh')">
          <RefreshCw class="icon-sm" :class="{ 'spin-soft': syncing }" /> Actualizar
        </button>
      </div>

      <div v-if="syncing || pendingEvents" class="sync-strip">
        <span class="sync-dot" />
        <template v-if="pendingEvents">{{ pendingEvents }} por sincronizar</template>
        <template v-else>Sincronizando</template>
      </div>
    </section>

    <div class="logros-content-grid">
      <main class="logros-roster" aria-label="Logros por alumno">
        <article
          v-for="student in filteredStudents"
          :key="student.id"
          class="logro-student-card"
          :class="{ 'pulse-glow': cardClass[student.id], selected: selectedStudent?.id === student.id }"
        >
          <button class="logro-student-top" type="button" @click="selectedStudentId = student.id">
            <span class="logro-avatar-ring">
              <ProcessedStudentPhoto :src="student.foto" :alt="student.nombre" :cache-key="student.matricula || student.id" :group-label="student.grupo" />
            </span>
            <span class="logro-student-name">
              <strong>{{ student.nombre }}</strong>
              <small>{{ bestCategoryLabel(stateFor(student.id)) }}</small>
            </span>
            <span class="points-bubble">{{ stateFor(student.id).pointsThisWeek }}</span>
          </button>

          <div class="logro-streak-strip">
            <span><Flame class="icon-sm" /> {{ maxStreak(stateFor(student.id)) }}</span>
            <span><Award class="icon-sm" /> {{ badgeCount(stateFor(student.id)) }}</span>
            <span><Star class="icon-sm" /> {{ stateFor(student.id).recent?.length || 0 }}</span>
          </div>

          <div class="quick-logros" aria-label="Registrar logro">
            <button
              v-for="category in categories"
              :key="category"
              class="logro-choice"
              :class="{ featured: category === featuredCategory }"
              type="button"
              :aria-label="`Registrar ${category} para ${student.nombre}`"
              @click="award(student.id, category)"
            >
              <span>{{ category }}</span>
              <b v-if="categoryPoints(stateFor(student.id), category)">{{ categoryPoints(stateFor(student.id), category) }}</b>
            </button>
          </div>
        </article>

        <div v-if="!filteredStudents.length" class="empty-state">
          <strong>Sin coincidencias</strong>
          <button v-if="searchTerm || onlyWithLogros" type="button" @click="searchTerm = ''; onlyWithLogros = false">Ver todos</button>
        </div>
      </main>

      <aside class="logros-detail-rail">
        <section class="ranking-panel student-profile-card" v-if="selectedStudent && selectedState">
          <h3><UserRound class="icon-sm" /> Alumno</h3>
          <div class="profile-head">
            <span class="logro-avatar-ring large">
              <ProcessedStudentPhoto :src="selectedStudent.foto" :alt="selectedStudent.nombre" :cache-key="selectedStudent.matricula || selectedStudent.id" :group-label="selectedStudent.grupo" />
            </span>
            <div>
              <strong>{{ selectedStudent.nombre }}</strong>
              <small>{{ selectedState.pointsThisWeek }} pts · {{ selectedState.recent?.length || 0 }} logros</small>
            </div>
          </div>

          <div class="selected-metrics" aria-label="Resumen del alumno seleccionado">
            <span><Flame class="icon-sm" /> {{ maxStreak(selectedState) }}</span>
            <span><Award class="icon-sm" /> {{ badgeCount(selectedState) }}</span>
            <span><Star class="icon-sm" /> {{ selectedState.pointsThisWeek }}</span>
          </div>

          <div class="selected-awards" aria-label="Registrar logro al alumno seleccionado">
            <button
              v-for="category in categories"
              :key="category"
              class="logro-choice"
              :class="{ featured: category === featuredCategory }"
              type="button"
              @click="award(selectedStudent.id, category)"
            >
              {{ category }}
            </button>
          </div>

          <div class="profile-badges" v-if="selectedTopCategories.length">
            <span v-for="entry in selectedTopCategories" :key="entry.category" class="badge-token">
              <Trophy class="icon-sm" /> {{ entry.category }} · {{ entry.points }}
            </span>
          </div>

          <div class="recent-logros" v-if="selectedRecent.length">
            <h4>Recientes</h4>
            <p v-for="entry in selectedRecent" :key="`${entry.category}-${entry.awardedAt}`">
              <Star class="icon-sm" /> {{ entry.category }} · +{{ entry.points }}
            </p>
          </div>
        </section>

        <section class="ranking-panel class-ranking-panel">
          <h3><UsersRound class="icon-sm" /> Ranking</h3>
          <div class="ranking-tabs" role="tablist" aria-label="Tipo de ranking">
            <button
              v-for="option in rankingOptions"
              :key="option.value"
              type="button"
              :class="{ active: rankingMode === option.value }"
              @click="rankingMode = option.value"
            >
              {{ option.label }}
            </button>
          </div>
          <div class="ranking-list" :aria-label="rankingTitle[rankingMode]">
            <button v-for="(entry, index) in currentRanking" :key="entry.student.id" class="ranking-row" type="button" @click="selectedStudentId = entry.student.id">
              <span class="ranking-rank">{{ index + 1 }}</span>
              <span>
                <strong>{{ entry.student.nombre }}</strong>
                <small>{{ rankingTitle[rankingMode] }}</small>
              </span>
              <strong>{{ rankingMode === 'bestStreak' ? maxStreak(entry.state) : entry.state.pointsThisWeek }}</strong>
            </button>
            <p v-if="!currentRanking.length" class="ranking-empty">{{ hasLogros ? 'Sin datos para este ranking' : 'Aún no hay logros registrados' }}</p>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>
