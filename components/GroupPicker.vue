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
</script>

<template>
  <section class="group-journey">
    <div class="journey-topline">
      <NuxtLink class="ghost-button back-link" to="/">
        <ArrowLeft class="icon-sm" /> Planteles
      </NuxtLink>
      <div v-if="refreshing" class="sync-strip compact-sync">
        <RefreshCcw class="icon-sm spin-soft" /> Actualizando grupos
      </div>
    </div>

    <aside class="group-context-card" aria-label="Contexto del plantel">
      <div class="group-context-main">
        <BrandLogo variant="hero" />
        <span class="hero-eyebrow">{{ plantel }}</span>
        <h2>{{ plantelTitle }}</h2>
        <p>Elige el grupo y entra directo al pase de lista.</p>
      </div>

      <NuxtLink v-if="rememberedTarget" class="remembered-start-card" :to="rememberedTarget">
        <span class="remembered-icon"><CheckCircle2 class="icon" /></span>
        <span class="remembered-copy">
          <small>Continuar último grupo</small>
          <strong>{{ remembered?.grado }} {{ remembered?.grupo }}</strong>
          <em>Abrir pase de lista</em>
        </span>
        <ArrowRight class="icon" />
      </NuxtLink>

      <div class="selected-start-card">
        <span class="selected-start-label">Selección actual</span>
        <strong v-if="selectedGrado && selectedGrupo">{{ selectedGrado }} {{ selectedGrupo }}</strong>
        <strong v-else>Elige grado y grupo</strong>
        <small>{{ selectedGrado && selectedGrupo ? selectedRosterLabel : 'Primero selecciona una opción' }}</small>

        <NuxtLink v-if="target" class="primary-button group-start-button" :to="target">
          <span>
            <strong>Pase de lista</strong>
            <small>{{ selectedGrado }} · {{ selectedGrupo }}</small>
          </span>
          <ArrowRight class="icon-sm" />
        </NuxtLink>
      </div>
    </aside>

    <section class="group-picker-workspace" aria-label="Seleccionar grado y grupo">
      <section class="choice-panel grade-panel" aria-label="Grado">
        <div class="choice-heading">
          <span><b>1</b> Elige grado</span>
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
            <span>{{ grado }}</span>
            <CheckCircle2 v-if="selectedGrado === grado" class="icon-sm" />
          </button>
        </div>
      </section>

      <section class="choice-panel groups-panel" aria-label="Grupo">
        <div class="choice-heading">
          <span><b>2</b> Elige grupo</span>
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
            <span class="group-card-copy">
              <span class="group-card-meta">{{ groupMeta(selectedGrado, grupo)?.code || selectedGrado }}</span>
              <strong>{{ grupo }}</strong>
              <small v-if="groupMeta(selectedGrado, grupo)?.rosterCount"><UsersRound class="icon-xs" /> {{ groupMeta(selectedGrado, grupo)?.rosterCount }} alumnos</small>
              <small v-else><School class="icon-xs" /> Disponible</small>
            </span>
            <CheckCircle2 v-if="selectedGrupo === grupo" class="group-selected-check icon-sm" />
          </button>
        </div>
      </section>
    </section>
  </section>
</template>
