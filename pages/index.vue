<script setup lang="ts">
import { ArrowRight, CheckCircle2, Clock3, GraduationCap, MapPin, School, Sparkles } from 'lucide-vue-next'
import { PLANTELES, getPlantelByCode } from '~/utils/planteles'

const planteles = PLANTELES

const { getLastContext, getRememberedGroup } = usePlantelMemory()
const lastContext = ref<ReturnType<typeof getLastContext> | null>(null)
const rememberedByPlantel = ref<Record<string, { grado?: string; grupo?: string }>>({})

onMounted(() => {
  lastContext.value = getLastContext()
  rememberedByPlantel.value = Object.fromEntries(
    planteles.map((plantel) => [plantel.code, getRememberedGroup(plantel.code) || {}])
  )
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
  return `${remembered.grado} ${remembered.grupo}`
}

const plantelTarget = (plantel: string) => `/${plantel}?seleccionar=grupo`
</script>

<template>
  <main class="page-shell landing-shell selection-shell plantel-selection-page">
    <BrandHeader />

    <section class="selection-hero-card plantel-start-card" aria-labelledby="plantel-start-heading">
      <div class="selection-hero-copy plantel-start-copy">
        <span class="hero-eyebrow"><Sparkles class="icon-sm" /> lista-de-caritas app</span>
        <h2 id="plantel-start-heading">Pase de lista</h2>
        <p>Empieza por tu último grupo o elige el plantel donde vas a trabajar.</p>
      </div>

      <NuxtLink
        v-if="lastContext?.plantel"
        class="continue-primary"
        :to="continueTarget"
        aria-label="Continuar desde donde te quedaste"
      >
        <span class="continue-primary-icon"><Clock3 class="icon" /></span>
        <span class="continue-primary-copy">
          <small>Continuar desde donde te quedaste</small>
          <strong>{{ lastContextLabel }}</strong>
          <em>Abrir ahora</em>
        </span>
        <ArrowRight class="icon" />
      </NuxtLink>

      <div v-else class="start-empty-state">
        <span class="continue-primary-icon"><School class="icon" /></span>
        <span>
          <small>Primer paso</small>
          <strong>Elige un plantel</strong>
          <em>Guardaremos tu último grupo para la próxima vez.</em>
        </span>
      </div>

      <div class="selection-hero-logo">
        <BrandLogo variant="hero" />
      </div>
    </section>

    <section class="plantel-section" aria-labelledby="plantel-heading">
      <div class="section-heading-row plantel-heading-row">
        <span>
          <small>Planteles</small>
          <strong id="plantel-heading">Elige dónde pasar lista</strong>
        </span>
        <MapPin class="icon-sm" />
      </div>

      <div class="plantel-grid" aria-label="Planteles">
        <NuxtLink
          v-for="plantel in planteles"
          :key="plantel.code"
          class="plantel-card"
          :class="[`accent-${plantel.accent}`, { remembered: rememberedByPlantel[plantel.code]?.grado && rememberedByPlantel[plantel.code]?.grupo }]"
          :to="plantelTarget(plantel.code)"
          :aria-label="`Elegir ${plantel.title}`"
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
          <span class="plantel-action">
            <span>Elegir grupo</span>
            <ArrowRight class="icon-sm" />
          </span>
        </NuxtLink>
      </div>
    </section>
  </main>
</template>
