<script setup lang="ts">
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, RefreshCcw, School, UsersRound } from 'lucide-vue-next'
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
  <section class="group-journey group-selection-layout">
    <div class="selection-main-column">
      <div class="journey-topline">
        <NuxtLink class="ghost-button back-link" to="/">
          <ArrowLeft class="icon-sm" /> Planteles
        </NuxtLink>
        <div v-if="refreshing" class="sync-strip compact-sync">
          <RefreshCcw class="icon-sm spin-soft" /> Actualizando grupos
        </div>
      </div>

      <section class="selection-intro-card" aria-labelledby="group-selection-heading">
        <div class="selection-intro-copy">
          <h2 id="group-selection-heading">Selecciona tu grupo</h2>
          <p>Sigue los pasos para entrar al pase de lista.</p>
        </div>

        <ol class="selection-stepper" aria-label="Progreso para pase de lista">
          <li class="active"><span>1</span><strong>Grado</strong></li>
          <li><span>2</span><strong>Grupo</strong></li>
          <li><span>3</span><strong>Pase de lista</strong></li>
        </ol>
      </section>

      <section class="selection-panel choice-surface grade-panel" aria-labelledby="grade-heading">
        <div class="panel-heading selection-heading-block">
          <div>
            <span class="panel-step-badge">1</span>
            <div>
              <strong id="grade-heading">Elige grado</strong>
              <p>Selecciona el grado con el que trabajarás.</p>
            </div>
          </div>
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

      <section class="selection-panel choice-surface groups-panel" aria-labelledby="group-heading">
        <div class="panel-heading selection-heading-block">
          <div>
            <span class="panel-step-badge">2</span>
            <div>
              <strong id="group-heading">Elige grupo</strong>
              <p>Selecciona el grupo del grado <b>{{ selectedGrado }}</b>.</p>
            </div>
          </div>
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
            <span class="group-card-check"><CheckCircle2 class="icon-sm" /></span>
            <span class="group-card-icon"><GroupIcon :label="grupo" tone="green" /></span>
            <span class="group-card-copy">
              <strong>{{ grupo }}</strong>
              <small v-if="groupMeta(selectedGrado, grupo)?.rosterCount"><UsersRound class="icon-xs" /> {{ groupMeta(selectedGrado, grupo)?.rosterCount }} alumnos</small>
              <small v-else><School class="icon-xs" /> Disponible</small>
            </span>
          </button>
        </div>
      </section>

      <section class="selection-panel quick-access-panel" aria-labelledby="remembered-heading">
        <template v-if="rememberedTarget">
          <div class="quick-access-copy">
            <span class="quick-access-icon"><Clock3 class="icon-sm" /></span>
            <div>
              <strong id="remembered-heading">Continuar último grupo</strong>
              <p>Ingresa rápidamente al último grupo con el que trabajaste.</p>
            </div>
          </div>

          <NuxtLink class="quick-access-action" :to="rememberedTarget">
            <span>{{ remembered?.grado }} · {{ remembered?.grupo }}</span>
            <ArrowRight class="icon-sm" />
          </NuxtLink>
        </template>

        <template v-else>
          <div class="quick-access-copy">
            <span class="quick-access-icon"><CheckCircle2 class="icon-sm" /></span>
            <div>
              <strong id="remembered-heading">Selección lista</strong>
              <p>Elige un grupo para continuar al pase de lista.</p>
            </div>
          </div>

          <div class="quick-access-placeholder"><span>Sin grupo reciente</span></div>
        </template>
      </section>
    </div>

    <aside class="selection-sidebar group-selection-sidebar" aria-label="Selección actual">
      <div class="selection-sidebar-hero group-sidebar-hero">
        <BrandLogo variant="hero" />
      </div>

      <h3>Tu selección actual</h3>

      <div class="selection-summary-card">
        <article class="summary-detail-row">
          <span class="summary-detail-icon"><School class="icon-sm" /></span>
          <span class="summary-detail-copy">
            <small>Plantel</small>
            <strong>{{ plantelTitle }}</strong>
            <em>{{ props.plantel }}</em>
          </span>
        </article>

        <article class="summary-detail-row">
          <span class="summary-detail-icon"><School class="icon-sm" /></span>
          <span class="summary-detail-copy">
            <small>Grado</small>
            <strong>{{ selectedGrado || 'Selecciona grado' }}</strong>
            <em>Continúa con tu selección</em>
          </span>
        </article>

        <article class="summary-detail-row">
          <span class="summary-detail-icon"><UsersRound class="icon-sm" /></span>
          <span class="summary-detail-copy">
            <small>Grupo</small>
            <strong>{{ selectedGrupo || 'Selecciona grupo' }}</strong>
            <em>{{ selectedGrupo ? selectedRosterLabel : 'Selecciona un grupo para continuar' }}</em>
          </span>
        </article>
      </div>

      <NuxtLink v-if="target" class="primary-button selection-cta-button" :to="target">
        <School class="icon-sm" />
        Ir al pase de lista
        <ArrowRight class="icon-sm" />
      </NuxtLink>

      <NuxtLink v-if="rememberedTarget" class="selection-secondary-action" :to="rememberedTarget">
        <Clock3 class="icon-sm" />
        Continuar último grupo
        <ArrowRight class="icon-sm" />
      </NuxtLink>
    </aside>
  </section>
</template>
