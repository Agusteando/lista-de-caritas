<script setup lang="ts">
import { ArrowLeft, ArrowRight, CheckCircle2, RefreshCcw, School, UsersRound } from 'lucide-vue-next'
import type { PlantelMeta } from '~/types/domain'

const props = defineProps<{
  plantel: string
  meta: PlantelMeta | null
  remembered?: { grado?: string; grupo?: string } | null
  refreshing?: boolean
}>()

const selectedGrado = ref(props.remembered?.grado || '')
const selectedGrupo = ref(props.remembered?.grupo || '')

const grados = computed(() => props.meta?.grados || [])
const grupos = computed(() => selectedGrado.value && props.meta ? props.meta.gruposByGrado[selectedGrado.value] || [] : [])
const plantelTitle = computed(() => props.meta?.title || props.plantel)
const groupMeta = (grado: string, grupo: string) => props.meta?.groupMetaByKey?.[`${grado}:${grupo}`]
const selectedMeta = computed(() => selectedGrado.value && selectedGrupo.value ? groupMeta(selectedGrado.value, selectedGrupo.value) : null)
const selectedRosterLabel = computed(() => selectedMeta.value?.rosterCount ? `${selectedMeta.value.rosterCount} alumnos` : 'Grupo listo')
const rememberedTarget = computed(() => props.remembered?.grado && props.remembered?.grupo
  ? `/asistencia/${props.plantel}/${encodeURIComponent(props.remembered.grado)}/${encodeURIComponent(props.remembered.grupo)}`
  : '')

watch(() => props.remembered, (value) => {
  if (value?.grado) selectedGrado.value = value.grado
  if (value?.grupo) selectedGrupo.value = value.grupo
}, { immediate: true })

watch(grados, (value) => {
  if (!selectedGrado.value && value[0]) selectedGrado.value = value[0]
}, { immediate: true })

watch(grupos, (value) => {
  if (!value.includes(selectedGrupo.value)) selectedGrupo.value = value[0] || ''
}, { immediate: true })

const target = computed(() => selectedGrado.value && selectedGrupo.value
  ? `/asistencia/${props.plantel}/${encodeURIComponent(selectedGrado.value)}/${encodeURIComponent(selectedGrupo.value)}`
  : '')

const isRememberedSelection = computed(() => props.remembered?.grado === selectedGrado.value && props.remembered?.grupo === selectedGrupo.value)
</script>

<template>
  <section class="group-journey group-selection-page">
    <div class="journey-topline">
      <NuxtLink class="ghost-button back-link" to="/">
        <ArrowLeft class="icon-sm" /> Planteles
      </NuxtLink>
      <div v-if="refreshing" class="sync-strip compact-sync">
        <RefreshCcw class="icon-sm spin-soft" /> Actualizando grupos
      </div>
    </div>

    <section class="selection-intro-card group-intro-card" aria-labelledby="group-page-heading">
      <div class="selection-page-copy">
        <h2 id="group-page-heading">Selecciona tu grupo</h2>
        <p>Sigue los pasos para entrar al pase de lista de {{ plantelTitle }}.</p>
      </div>

      <ol class="selection-progress" aria-label="Progreso del flujo">
        <li class="is-complete">
          <span class="selection-progress-dot">1</span>
          <span>Plantel</span>
        </li>
        <li class="is-current">
          <span class="selection-progress-dot">2</span>
          <span>Grupo</span>
        </li>
        <li>
          <span class="selection-progress-dot">3</span>
          <span>Pase de lista</span>
        </li>
      </ol>
    </section>

    <section class="selection-dashboard group-dashboard">
      <div class="selection-main-column">
        <section class="selection-panel grade-panel" aria-labelledby="grado-choice-heading">
          <div class="selection-panel-head">
            <div>
              <span class="step-badge">1</span>
              <strong id="grado-choice-heading">Elige grado</strong>
              <p>Selecciona el grado con el que trabajarás.</p>
            </div>
          </div>

          <div class="grade-choice-grid">
            <button
              v-for="grado in grados"
              :key="grado"
              class="grade-choice-card"
              :class="{ active: selectedGrado === grado }"
              type="button"
              @click="selectedGrado = grado"
            >
              <span>{{ grado }}</span>
              <CheckCircle2 v-if="selectedGrado === grado" class="icon-sm" />
            </button>
          </div>
        </section>

        <section class="selection-panel group-panel" aria-labelledby="grupo-choice-heading">
          <div class="selection-panel-head">
            <div>
              <span class="step-badge">2</span>
              <strong id="grupo-choice-heading">Elige grupo</strong>
              <p v-if="selectedGrado">Selecciona el grupo del grado {{ selectedGrado }}.</p>
              <p v-else>Primero selecciona un grado.</p>
            </div>
          </div>

          <div class="group-choice-grid">
            <button
              v-for="grupo in grupos"
              :key="grupo"
              class="group-choice-card"
              :class="{ active: selectedGrupo === grupo }"
              type="button"
              @click="selectedGrupo = grupo"
            >
              <span class="group-choice-icon"><GroupIcon :label="grupo" tone="green" /></span>
              <span class="group-choice-copy">
                <strong>{{ grupo }}</strong>
                <small v-if="groupMeta(selectedGrado, grupo)?.rosterCount"><UsersRound class="icon-xs" /> {{ groupMeta(selectedGrado, grupo)?.rosterCount }} alumnos</small>
                <small v-else><School class="icon-xs" /> Disponible</small>
              </span>
              <CheckCircle2 v-if="selectedGrupo === grupo" class="group-selected-check icon-sm" />
            </button>
          </div>
        </section>

        <NuxtLink
          v-if="rememberedTarget && !isRememberedSelection"
          class="selection-continue-card compact"
          :to="rememberedTarget"
        >
          <span class="selection-continue-icon"><CheckCircle2 class="icon" /></span>
          <span class="selection-continue-copy">
            <strong>Continuar último grupo</strong>
            <small>Vuelve rápido a {{ remembered?.grado }} · {{ remembered?.grupo }}.</small>
          </span>
          <span class="selection-continue-target simple-arrow">
            <ArrowRight class="icon-sm" />
          </span>
        </NuxtLink>
      </div>

      <aside class="selection-summary-rail group-summary-rail" aria-label="Selección actual">
        <div class="selection-summary-hero">
          <BrandLogo variant="hero" />
          <h3>Tu selección actual</h3>
        </div>

        <div class="selection-summary-card summary-detail-card">
          <article>
            <span class="selection-summary-icon"><School class="icon" /></span>
            <div>
              <small>Plantel</small>
              <strong>{{ plantelTitle }}</strong>
              <p>{{ props.plantel }}</p>
            </div>
          </article>

          <article>
            <span class="selection-summary-icon"><School class="icon" /></span>
            <div>
              <small>Grado</small>
              <strong>{{ selectedGrado || 'Selecciona un grado' }}</strong>
              <p>{{ selectedGrado ? `${grupos.length} grupos disponibles` : 'Primero elige un grado' }}</p>
            </div>
          </article>

          <article>
            <span class="selection-summary-icon subtle"><UsersRound class="icon" /></span>
            <div>
              <small>Grupo</small>
              <strong>{{ selectedGrupo || 'Selecciona un grupo' }}</strong>
              <p>{{ selectedGrupo ? selectedRosterLabel : 'Completa la selección para continuar' }}</p>
            </div>
          </article>
        </div>

        <NuxtLink v-if="target" class="primary-button selection-primary-action" :to="target">
          <School class="icon" />
          Ir al pase de lista
          <ArrowRight class="icon-sm" />
        </NuxtLink>
      </aside>
    </section>
  </section>
</template>
