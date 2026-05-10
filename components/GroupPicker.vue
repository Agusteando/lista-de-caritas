<script setup lang="ts">
import { ArrowLeft, ArrowRight, CheckCircle2, RefreshCcw } from 'lucide-vue-next'
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

    <section class="hero-card group-hero compact-copy">
      <span class="hero-eyebrow">{{ plantel }}</span>
      <h2>{{ plantelTitle }}</h2>
      <div v-if="remembered?.grado && remembered?.grupo" class="remembered-chip">
        <CheckCircle2 class="icon-sm" /> {{ remembered.grado }} {{ remembered.grupo }}
      </div>
    </section>

    <section class="choice-panel" aria-label="Grado">
      <div class="choice-heading">
        <span>Grado</span>
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

    <section class="choice-panel" aria-label="Grupo">
      <div class="choice-heading">
        <span>Grupo</span>
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
          <span>{{ groupMeta(selectedGrado, grupo)?.code || selectedGrado }}</span>
          <strong>{{ grupo }}</strong>
        </button>
      </div>
    </section>

    <NuxtLink v-if="target" class="primary-button group-start-button" :to="target">
      <CheckCircle2 class="icon-sm" /> Pase de lista <ArrowRight class="icon-sm" />
    </NuxtLink>
  </section>
</template>
