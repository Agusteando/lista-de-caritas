<script setup lang="ts">
import { Award, Flame, Medal, Sparkles, Star, Trophy, UserRound } from 'lucide-vue-next'
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
}>()

const emit = defineEmits<{ award: [studentId: string, category: LogroCategory] }>()
const rankingMode = ref<RankingMode>('topLogros')
const selectedStudentId = ref<string | null>(null)
const cardClass = ref<Record<string, boolean>>({})

const categories = logroCategories

const rankingTitle: Record<RankingMode, string> = {
  topLogros: 'Top semanal',
  bestStreak: 'Mejor racha',
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

const stateFor = (studentId: string) => props.states[studentId] || defaultState(studentId)
const selectedStudent = computed(() => props.students.find((student) => student.id === selectedStudentId.value) || props.students[0] || null)
const selectedState = computed(() => selectedStudent.value ? stateFor(selectedStudent.value.id) : null)
const totalPoints = computed(() => Object.values(props.states || {}).reduce((sum, state) => sum + (state.pointsThisWeek || 0), 0))
const activeStudents = computed(() => Object.values(props.states || {}).filter((state) => (state.pointsThisWeek || 0) > 0).length)
const totalBadges = computed(() => Object.values(props.states || {}).reduce((sum, state) => sum + (state.badges?.length || 0), 0))
const maxStreak = (state: StudentLogrosState) => Math.max(0, ...Object.values(state.streaks || {}).map((value) => Number(value || 0)))
const bestCategoryLabel = (state: StudentLogrosState) => state.bestCategory || (state.pointsThisWeek ? 'Semana activa' : 'Sin logros aún')
const categoryPoints = (state: StudentLogrosState, category: LogroCategory) => state.categoryPoints?.[category] || 0

watch(() => props.students, () => {
  if (!selectedStudentId.value && props.students[0]) selectedStudentId.value = props.students[0].id
}, { immediate: true })

const award = async (studentId: string, category: LogroCategory) => {
  selectedStudentId.value = studentId
  cardClass.value = { ...cardClass.value, [studentId]: true }
  window.setTimeout(() => {
    cardClass.value = { ...cardClass.value, [studentId]: false }
  }, 900)
  emit('award', studentId, category)
}
</script>

<template>
  <div class="logros-section">
    <section class="logros-command-card">
      <div class="logros-command-copy">
        <span class="hero-eyebrow"><Sparkles class="icon-sm" /> Logros</span>
        <h2>Reconocimientos de la semana</h2>
        <div class="featured-logro"><Medal class="icon-sm" /> {{ featuredCategory }} · +2</div>
      </div>
      <div class="logros-command-stats" aria-label="Resumen de Logros">
        <article><strong>{{ totalPoints }}</strong><span>pts</span></article>
        <article><strong>{{ activeStudents }}</strong><span>activos</span></article>
        <article><strong>{{ totalBadges }}</strong><span>insignias</span></article>
      </div>
      <div v-if="syncing" class="sync-strip"><span class="sync-dot" /> Sincronizando</div>
    </section>

    <div class="logros-content-grid">
      <main class="logros-roster" aria-label="Logros por alumno">
        <article
          v-for="student in students"
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
            <span><Award class="icon-sm" /> {{ stateFor(student.id).badges?.length || 0 }}</span>
          </div>

          <div class="quick-logros" aria-label="Registrar Logro">
            <button
              v-for="category in categories"
              :key="category"
              class="logro-choice"
              :class="{ featured: category === featuredCategory }"
              type="button"
              @click="award(student.id, category)"
            >
              <span>{{ category }}</span>
              <b v-if="categoryPoints(stateFor(student.id), category)">{{ categoryPoints(stateFor(student.id), category) }}</b>
            </button>
          </div>
        </article>

        <div v-if="!students.length" class="empty-state"><strong>Lista en preparación</strong></div>
      </main>

      <aside class="logros-detail-rail">
        <section class="ranking-panel student-profile-card" v-if="selectedStudent && selectedState">
          <h3><UserRound class="icon-sm" /> Alumno seleccionado</h3>
          <div class="profile-head">
            <span class="logro-avatar-ring large">
              <ProcessedStudentPhoto :src="selectedStudent.foto" :alt="selectedStudent.nombre" :cache-key="selectedStudent.matricula || selectedStudent.id" :group-label="selectedStudent.grupo" />
            </span>
            <div>
              <strong>{{ selectedStudent.nombre }}</strong>
              <small>{{ selectedState.pointsThisWeek }} pts · racha {{ maxStreak(selectedState) }}</small>
            </div>
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

          <div class="profile-badges" v-if="selectedState.badges?.length">
            <span v-for="badge in selectedState.badges.slice(-4)" :key="`${badge.category}-${badge.level}`" class="badge-token">
              <Trophy class="icon-sm" /> {{ badge.level }} · {{ badge.category }}
            </span>
          </div>

          <div class="recent-logros" v-if="selectedState.recent?.length">
            <h4>Recientes</h4>
            <p v-for="entry in selectedState.recent.slice(0, 4)" :key="`${entry.category}-${entry.awardedAt}`">
              <Star class="icon-sm" /> {{ entry.category }} · +{{ entry.points }}
            </p>
          </div>
        </section>

        <section class="ranking-panel">
          <h3>Ranking</h3>
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
            <div v-for="(entry, index) in rankings[rankingMode]" :key="entry.student.id" class="ranking-row">
              <span class="ranking-rank">{{ index + 1 }}</span>
              <div>
                <strong>{{ entry.student.nombre }}</strong><br>
                <small>{{ rankingTitle[rankingMode] }}</small>
              </div>
              <strong>{{ rankingMode === 'bestStreak' ? maxStreak(entry.state) : entry.state.pointsThisWeek }}</strong>
            </div>
            <p v-if="!rankings[rankingMode]?.length" class="ranking-empty">Sin registros todavía</p>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>
