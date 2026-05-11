<script setup lang="ts">
import { ArrowRight, CheckCircle2, Clock3, GraduationCap, School } from 'lucide-vue-next'
import { PLANTELES, getPlantelByCode } from '~/utils/planteles'

const planteles = PLANTELES

const { getLastContext, getRememberedGroup } = usePlantelMemory()
const lastContext = ref<ReturnType<typeof getLastContext> | null>(null)
const rememberedByPlantel = ref<Record<string, { grado?: string; grupo?: string }>>({})
const selectedPlantelCode = ref(planteles[0]?.code || '')

onMounted(() => {
  lastContext.value = getLastContext()
  rememberedByPlantel.value = Object.fromEntries(
    planteles.map((plantel) => [plantel.code, getRememberedGroup(plantel.code) || {}])
  )

  if (lastContext.value?.plantel && getPlantelByCode(lastContext.value.plantel)) {
    selectedPlantelCode.value = lastContext.value.plantel
  }
})

const selectedPlantel = computed(() => getPlantelByCode(selectedPlantelCode.value) || planteles[0] || null)
const selectedRemembered = computed(() => rememberedByPlantel.value[selectedPlantelCode.value] || {})

const lastPlantelTitle = computed(() => getPlantelByCode(lastContext.value?.plantel)?.title || lastContext.value?.plantel || '')

const continueTarget = computed(() => {
  const context = lastContext.value
  if (!context?.plantel) return '/'
  if (context.grado && context.grupo) {
    return `/asistencia/${context.plantel}/${encodeURIComponent(context.grado)}/${encodeURIComponent(context.grupo)}`
  }
  return `/${context.plantel}`
})

const lastContextLabel = computed(() => {
  const context = lastContext.value
  if (!context?.plantel) return ''
  return [lastPlantelTitle.value, context.grado, context.grupo].filter(Boolean).join(' · ')
})

const selectedTarget = computed(() => selectedPlantel.value ? `/${selectedPlantel.value.code}?seleccionar=grupo` : '/')
const selectedRememberedLabel = computed(() => selectedRemembered.value?.grado && selectedRemembered.value?.grupo
  ? `${selectedRemembered.value.grado} · ${selectedRemembered.value.grupo}`
  : '')
</script>

<template>
  <main class="page-shell landing-shell selection-shell plantel-selection-page">
    <BrandHeader />

    <section class="selection-intro-card" aria-labelledby="plantel-page-heading">
      <div class="selection-page-copy">
        <h2 id="plantel-page-heading">Selecciona tu plantel</h2>
        <p>Empieza el flujo del pase de lista eligiendo el plantel donde vas a trabajar.</p>
      </div>

      <ol class="selection-progress" aria-label="Progreso del flujo">
        <li class="is-current">
          <span class="selection-progress-dot">1</span>
          <span>Plantel</span>
        </li>
        <li>
          <span class="selection-progress-dot">2</span>
          <span>Grupo</span>
        </li>
        <li>
          <span class="selection-progress-dot">3</span>
          <span>Pase de lista</span>
        </li>
      </ol>
    </section>

    <section class="selection-dashboard plantel-dashboard">
      <div class="selection-main-column">
        <section class="selection-panel plantel-panel" aria-labelledby="plantel-choice-heading">
          <div class="selection-panel-head">
            <div>
              <span class="step-badge">1</span>
              <strong id="plantel-choice-heading">Elige plantel</strong>
              <p>Selecciona el plantel con el que trabajarás hoy.</p>
            </div>
          </div>

          <div class="plantel-choice-grid" aria-label="Planteles disponibles">
            <button
              v-for="plantel in planteles"
              :key="plantel.code"
              class="plantel-choice-card"
              :class="[
                `accent-${plantel.accent}`,
                { active: selectedPlantelCode === plantel.code, remembered: rememberedByPlantel[plantel.code]?.grado && rememberedByPlantel[plantel.code]?.grupo }
              ]"
              type="button"
              @click="selectedPlantelCode = plantel.code"
            >
              <span class="plantel-choice-topline">
                <span class="plantel-choice-icon"><GraduationCap class="icon" /></span>
                <CheckCircle2 v-if="selectedPlantelCode === plantel.code" class="icon-sm plantel-choice-check" />
              </span>
              <span class="plantel-choice-copy">
                <small>{{ plantel.level }}</small>
                <strong>{{ plantel.title }}</strong>
                <span>{{ plantel.city }}</span>
              </span>
            </button>
          </div>
        </section>

        <NuxtLink
          v-if="lastContext?.plantel"
          class="selection-continue-card"
          :to="continueTarget"
          aria-label="Continuar con el último grupo usado"
        >
          <span class="selection-continue-icon"><Clock3 class="icon" /></span>
          <span class="selection-continue-copy">
            <strong>Continuar último grupo</strong>
            <small>Ingresa rápidamente al último grupo con el que trabajaste.</small>
          </span>
          <span class="selection-continue-target">
            <b>{{ lastContextLabel }}</b>
            <ArrowRight class="icon-sm" />
          </span>
        </NuxtLink>
      </div>

      <aside class="selection-summary-rail plantel-summary-rail" aria-label="Selección actual">
        <div class="selection-summary-hero">
          <BrandLogo variant="hero" />
          <h3>Tu selección actual</h3>
        </div>

        <div class="selection-summary-card" v-if="selectedPlantel">
          <article>
            <span class="selection-summary-icon"><School class="icon" /></span>
            <div>
              <small>Plantel</small>
              <strong>{{ selectedPlantel.title }}</strong>
              <p>{{ selectedPlantel.level }} · {{ selectedPlantel.city }}</p>
            </div>
          </article>

          <article v-if="selectedRememberedLabel">
            <span class="selection-summary-icon subtle"><CheckCircle2 class="icon" /></span>
            <div>
              <small>Último grupo</small>
              <strong>{{ selectedRememberedLabel }}</strong>
              <p>Se usará como referencia al abrir la selección de grupo.</p>
            </div>
          </article>
        </div>

        <NuxtLink v-if="selectedPlantel" class="primary-button selection-primary-action" :to="selectedTarget">
          <GraduationCap class="icon" />
          Ir a seleccionar grupo
          <ArrowRight class="icon-sm" />
        </NuxtLink>
      </aside>
    </section>
  </main>
</template>
