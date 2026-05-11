<script setup lang="ts">
import { ArrowRight, CheckCircle2, Clock3, GraduationCap, MapPin, School, Sparkles } from 'lucide-vue-next'
import { PLANTELES, getPlantelByCode } from '~/utils/planteles'

const planteles = PLANTELES

const { getLastContext, getRememberedGroup } = usePlantelMemory()
const lastContext = ref<ReturnType<typeof getLastContext> | null>(null)
const rememberedByPlantel = ref<Record<string, { grado?: string; grupo?: string }>>({})
const selectedPlantelCode = ref('')

onMounted(() => {
  lastContext.value = getLastContext()
  rememberedByPlantel.value = Object.fromEntries(
    planteles.map((plantel) => [plantel.code, getRememberedGroup(plantel.code) || {}])
  )

  selectedPlantelCode.value = lastContext.value?.plantel || planteles[0]?.code || ''
})

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

const rememberedLabel = (plantel: string) => {
  const remembered = rememberedByPlantel.value[plantel]
  if (!remembered?.grado || !remembered?.grupo) return ''
  return `${remembered.grado} · ${remembered.grupo}`
}

const plantelTarget = (plantel: string) => `/${plantel}?seleccionar=grupo`
const selectedPlantel = computed(() => getPlantelByCode(selectedPlantelCode.value) || planteles[0] || null)
const selectedRemembered = computed(() => selectedPlantel.value ? rememberedByPlantel.value[selectedPlantel.value.code] || {} : {})
const selectedTarget = computed(() => selectedPlantel.value ? plantelTarget(selectedPlantel.value.code) : '/')
const selectedSupportLine = computed(() => {
  if (!selectedPlantel.value) return 'Selecciona un plantel para continuar.'
  if (selectedRemembered.value?.grado && selectedRemembered.value?.grupo) return `${selectedRemembered.value.grado} · ${selectedRemembered.value.grupo}`
  return 'Elige grado y grupo para comenzar.'
})
</script>

<template>
  <main class="page-shell selection-shell plantel-selection-page">
    <BrandHeader />

    <section class="selection-layout plantel-selection-layout">
      <div class="selection-main-column">
        <section class="selection-intro-card" aria-labelledby="plantel-start-heading">
          <div class="selection-intro-copy">
            <span class="hero-eyebrow"><Sparkles class="icon-sm" /> lista-de-caritas app</span>
            <h2 id="plantel-start-heading">Selecciona tu plantel</h2>
            <p>Empieza por la escuela donde vas a trabajar y continúa al grado y grupo en un flujo claro y rápido.</p>
          </div>

          <ol class="selection-stepper" aria-label="Pasos para comenzar">
            <li class="active"><span>1</span><strong>Plantel</strong></li>
            <li><span>2</span><strong>Grado</strong></li>
            <li><span>3</span><strong>Pase de lista</strong></li>
          </ol>
        </section>

        <section class="selection-panel choice-surface plantel-choice-panel" aria-labelledby="plantel-heading">
          <div class="panel-heading">
            <div>
              <span class="panel-step-badge">1</span>
              <div>
                <strong id="plantel-heading">Elige plantel</strong>
                <p>Selecciona la escuela con la que trabajarás.</p>
              </div>
            </div>
          </div>

          <div class="plantel-grid" aria-label="Planteles">
            <NuxtLink
              v-for="plantel in planteles"
              :key="plantel.code"
              class="plantel-card"
              :class="[
                `accent-${plantel.accent}`,
                { active: selectedPlantelCode === plantel.code, remembered: rememberedByPlantel[plantel.code]?.grado && rememberedByPlantel[plantel.code]?.grupo }
              ]"
              :to="plantelTarget(plantel.code)"
              :aria-label="`Elegir ${plantel.title}`"
              @mouseenter="selectedPlantelCode = plantel.code"
              @focus="selectedPlantelCode = plantel.code"
              @click="selectedPlantelCode = plantel.code"
            >
              <span class="plantel-icon"><GraduationCap class="icon" /></span>
              <span class="plantel-copy">
                <span class="plantel-card-topline">
                  <small class="plantel-code">{{ plantel.code }}</small>
                  <em v-if="rememberedLabel(plantel.code)"><CheckCircle2 class="icon-xs" /> {{ rememberedLabel(plantel.code) }}</em>
                </span>
                <strong>{{ plantel.title }}</strong>
                <small>{{ plantel.level }} · {{ plantel.city }}</small>
              </span>
              <span class="choice-check"><CheckCircle2 class="icon-sm" /></span>
            </NuxtLink>
          </div>
        </section>

        <section class="selection-panel quick-access-panel" aria-labelledby="continue-heading">
          <template v-if="lastContext?.plantel">
            <div class="quick-access-copy">
              <span class="quick-access-icon"><Clock3 class="icon-sm" /></span>
              <div>
                <strong id="continue-heading">Continuar último grupo</strong>
                <p>Ingresa rápidamente al último grupo con el que trabajaste.</p>
              </div>
            </div>

            <NuxtLink class="quick-access-action" :to="continueTarget">
              <span>{{ lastContextLabel }}</span>
              <ArrowRight class="icon-sm" />
            </NuxtLink>
          </template>

          <template v-else>
            <div class="quick-access-copy">
              <span class="quick-access-icon"><School class="icon-sm" /></span>
              <div>
                <strong id="continue-heading">Listo para comenzar</strong>
                <p>Elige un plantel para continuar al siguiente paso.</p>
              </div>
            </div>

            <div class="quick-access-placeholder">
              <span>Selecciona un plantel</span>
            </div>
          </template>
        </section>
      </div>

      <aside class="selection-sidebar" aria-label="Resumen de selección">
        <div class="selection-sidebar-hero">
          <BrandLogo variant="hero" />
        </div>

        <h3>Tu selección actual</h3>

        <div class="selection-summary-card">
          <article class="summary-detail-row">
            <span class="summary-detail-icon"><School class="icon-sm" /></span>
            <span class="summary-detail-copy">
              <small>Plantel</small>
              <strong>{{ selectedPlantel?.title || 'Sin selección' }}</strong>
              <em>{{ selectedPlantel?.level }}<template v-if="selectedPlantel?.city"> · {{ selectedPlantel.city }}</template></em>
            </span>
          </article>

          <article class="summary-detail-row">
            <span class="summary-detail-icon"><MapPin class="icon-sm" /></span>
            <span class="summary-detail-copy">
              <small>Siguiente paso</small>
              <strong>{{ selectedPlantel?.code || '—' }}</strong>
              <em>{{ selectedSupportLine }}</em>
            </span>
          </article>
        </div>

        <NuxtLink class="primary-button selection-cta-button" :to="selectedTarget">
          <School class="icon-sm" />
          Ir a grados
          <ArrowRight class="icon-sm" />
        </NuxtLink>

        <NuxtLink v-if="lastContext?.plantel" class="selection-secondary-action" :to="continueTarget">
          <Clock3 class="icon-sm" />
          Continuar último grupo
          <ArrowRight class="icon-sm" />
        </NuxtLink>
      </aside>
    </section>
  </main>
</template>
