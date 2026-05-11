<script setup lang="ts">
import { ArrowRight, CheckCircle2, ChevronRight, Clock3, GraduationCap, School, UsersRound } from 'lucide-vue-next'
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
  if (!selectedPlantel.value) return 'Elige una escuela para continuar.'
  if (selectedRemembered.value?.grado && selectedRemembered.value?.grupo) return `${selectedRemembered.value.grado} · ${selectedRemembered.value.grupo}`
  return 'Elige el grado y grupo para continuar.'
})
</script>

<template>
  <main class="page-shell selection-shell plantel-selection-page">
    <BrandHeader />

    <section class="selection-layout plantel-selection-layout">
      <div class="selection-main-column">
        <section class="selection-intro-card selection-intro-plain" aria-labelledby="plantel-start-heading">
          <div class="selection-intro-copy">
            <h2 id="plantel-start-heading">Selecciona tu plantel</h2>
            <p>Elige una escuela para continuar.</p>
          </div>

          <ol class="selection-stepper" aria-label="Pasos para comenzar">
            <li class="active"><span>1</span><strong>Plantel</strong></li>
            <li><span>2</span><strong>Grado</strong></li>
            <li><span>3</span><strong>Pase de lista</strong></li>
          </ol>
        </section>

        <section class="plantel-card-grid" aria-label="Planteles">
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
              <strong>{{ plantel.title }}</strong>
              <small>{{ plantel.level }} · {{ plantel.city }}</small>
              <em v-if="rememberedLabel(plantel.code)"><CheckCircle2 class="icon-xs" /> {{ rememberedLabel(plantel.code) }}</em>
            </span>
            <span class="choice-check"><CheckCircle2 class="icon-sm" /></span>
            <ChevronRight class="choice-chevron icon-sm" />
          </NuxtLink>
        </section>

        <section v-if="lastContext?.plantel" class="selection-panel quick-access-panel" aria-labelledby="continue-heading">
          <div class="quick-access-copy">
            <span class="quick-access-icon"><Clock3 class="icon-sm" /></span>
            <div>
              <strong id="continue-heading">Continuar último grupo</strong>
              <p>Retoma tu último grupo de forma rápida.</p>
            </div>
          </div>

          <NuxtLink class="quick-access-action" :to="continueTarget">
            <span>{{ lastContextLabel }}</span>
            <ArrowRight class="icon-sm" />
          </NuxtLink>
        </section>
      </div>

      <aside class="selection-summary-shell" aria-label="Resumen de selección">
        <header class="selection-summary-header">
          <h3>Tu selección</h3>
        </header>

        <div class="selection-summary-body">
          <article class="summary-detail-row">
            <span class="summary-detail-icon" :class="selectedPlantel ? `accent-${selectedPlantel.accent}` : ''"><GraduationCap class="icon-sm" /></span>
            <span class="summary-detail-copy">
              <small>Plantel seleccionado</small>
              <strong>{{ selectedPlantel?.title || 'Sin selección' }}</strong>
              <em>{{ selectedPlantel?.level }}<template v-if="selectedPlantel?.city"> · {{ selectedPlantel.city }}</template></em>
            </span>
          </article>

          <article class="summary-detail-row">
            <span class="summary-detail-icon"><UsersRound class="icon-sm" /></span>
            <span class="summary-detail-copy">
              <small>Siguiente paso</small>
              <strong>Grados</strong>
              <em>{{ selectedSupportLine }}</em>
            </span>
          </article>
        </div>

        <footer class="selection-summary-actions">
          <NuxtLink class="primary-button selection-cta-button" :to="selectedTarget">
            Continuar a grados
            <ArrowRight class="icon-sm" />
          </NuxtLink>

          <NuxtLink v-if="lastContext?.plantel" class="selection-secondary-action" :to="continueTarget">
            <Clock3 class="icon-sm" />
            <span>Continuar último grupo</span>
            <ChevronRight class="icon-sm" />
          </NuxtLink>
        </footer>
      </aside>
    </section>

    <SelectionFooter />
  </main>
</template>
