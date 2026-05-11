<script setup lang="ts">
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, RefreshCcw, UsersRound } from 'lucide-vue-next'
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
const totalGroups = computed(() => Object.values(props.meta?.gruposByGrado || {}).reduce((sum, groups) => sum + groups.length, 0))
const selectedMeta = computed(() => selectedGrado.value && selectedGrupo.value ? groupMeta(selectedGrado.value, selectedGrupo.value) : null)
const selectedRosterLabel = computed(() => selectedMeta.value?.rosterCount ? `${selectedMeta.value.rosterCount} alumnos` : 'Grupo seleccionado')

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
</script>

<template>
  <section class="group-journey">
    <div class="journey-topline">
      <NuxtLink class="ghost-button back-link" to="/">
        <ArrowLeft class="icon-sm" /> Planteles
      </NuxtLink>
      <div v-if="refreshing" class="sync-strip compact-sync">
        <RefreshCcw class="icon-sm spin-soft" /> Actualizando
      </div>
    </div>

    <section class="group-hero selection-hero-card">
      <div class="group-hero-brand">
        <AnimatedLogo variant="hero" />
      </div>

      <div class="selection-hero-copy">
        <span class="hero-eyebrow">{{ plantel }}</span>
        <h2>{{ plantelTitle }}</h2>
        <p>Selecciona grado y grupo. La siguiente visita recordará esta elección.</p>
      </div>

      <div class="group-hero-summary" aria-label="Resumen del plantel">
        <article><ClipboardList class="icon-sm" /><strong>{{ grados.length }}</strong><span>grados</span></article>
        <article><UsersRound class="icon-sm" /><strong>{{ totalGroups }}</strong><span>grupos</span></article>
      </div>

      <div v-if="selectedGrado && selectedGrupo" class="group-selection-preview">
        <CheckCircle2 class="icon-sm" />
        <span>
          <strong>{{ selectedGrado }} {{ selectedGrupo }}</strong>
          <small>{{ selectedRosterLabel }}</small>
        </span>
      </div>

      <div v-if="remembered?.grado && remembered?.grupo" class="remembered-chip">
        <CheckCircle2 class="icon-sm" /> Último grupo: {{ remembered.grado }} {{ remembered.grupo }}
      </div>
    </section>

    <section class="choice-panel grade-panel" aria-label="Grado">
      <div class="choice-heading">
        <span><b>1</b> Grado</span>
        <strong>{{ selectedGrado || '—' }}</strong>
      </div>
      <div class="grade-grid">
        <button
          v-for="grado in grados"
          :key="grado"
          class="grade-card"
          :class="{ active: selectedGrado === grado }"
          type="button"
          @click="selectedGrado = grado"
        >
          {{ grado }}
        </button>
      </div>
    </section>

    <section class="choice-panel groups-panel" aria-label="Grupo">
      <div class="choice-heading">
        <span><b>2</b> Grupo</span>
        <strong>{{ selectedGrupo || '—' }}</strong>
      </div>
      <div class="group-grid">
        <button
          v-for="grupo in grupos"
          :key="grupo"
          class="group-card"
          :class="{ active: selectedGrupo === grupo }"
          type="button"
          @click="selectedGrupo = grupo"
        >
          <span class="group-card-icon"><GroupIcon :label="grupo" tone="green" /></span>
          <span class="group-card-meta">{{ groupMeta(selectedGrado, grupo)?.code || selectedGrado }}</span>
          <strong>{{ grupo }}</strong>
          <small v-if="groupMeta(selectedGrado, grupo)?.rosterCount">{{ groupMeta(selectedGrado, grupo)?.rosterCount }} alumnos</small>
          <small v-else>{{ groupMeta(selectedGrado, grupo)?.turn || 'Disponible' }}</small>
        </button>
      </div>
    </section>

    <NuxtLink v-if="target" class="primary-button group-start-button" :to="target">
      <span>
        <strong>Pase de lista</strong>
        <small>{{ selectedGrado }} · {{ selectedGrupo }} · {{ selectedRosterLabel }}</small>
      </span>
      <ArrowRight class="icon-sm" />
    </NuxtLink>
  </section>
</template>
