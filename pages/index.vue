<script setup lang="ts">
import { ArrowRight, CheckCircle2, Clock3, GraduationCap, MapPin, School, Sparkles } from 'lucide-vue-next'
import { PLANTELES } from '~/utils/planteles'

const planteles = PLANTELES

const { getLastContext, getRememberedGroup, rememberPlantel } = usePlantelMemory()
const lastContext = ref<ReturnType<typeof getLastContext> | null>(null)
const rememberedByPlantel = ref<Record<string, { grado?: string; grupo?: string }>>({})

onMounted(() => {
  lastContext.value = getLastContext()
  rememberedByPlantel.value = Object.fromEntries(
    planteles.map((plantel) => [plantel.code, getRememberedGroup(plantel.code) || {}])
  )
})

const lastContextLabel = computed(() => {
  if (!lastContext.value?.plantel) return ''
  return [lastContext.value.plantel, lastContext.value.grado, lastContext.value.grupo].filter(Boolean).join(' · ')
})

const rememberedLabel = (plantel: string) => {
  const remembered = rememberedByPlantel.value[plantel]
  if (!remembered?.grado || !remembered?.grupo) return ''
  return `${remembered.grado} ${remembered.grupo}`
}

const selectPlantel = (plantel: string) => {
  rememberPlantel(plantel)
  const remembered = rememberedByPlantel.value[plantel]
  if (remembered?.grado && remembered?.grupo) {
    return navigateTo(`/asistencia/${plantel}/${encodeURIComponent(remembered.grado)}/${encodeURIComponent(remembered.grupo)}`)
  }
  return navigateTo(`/asistencia/${plantel}`)
}
</script>

<template>
  <main class="page-shell landing-shell selection-shell">
    <BrandHeader />

    <section class="selection-hero-card plantel-start-card" aria-labelledby="plantel-start-heading">
      <div class="selection-hero-logo">
        <BrandLogo variant="hero" />
      </div>

      <div class="selection-hero-copy plantel-start-copy">
        <span class="hero-eyebrow"><Sparkles class="icon-sm" /> lista-de-caritas app</span>
        <h2 id="plantel-start-heading">Pase de lista</h2>
        <p>Retoma tu último grupo o elige un plantel para empezar sin pasos extra.</p>
      </div>

      <button
        v-if="lastContext?.plantel"
        class="continue-primary"
        type="button"
        @click="selectPlantel(lastContext.plantel)"
      >
        <span class="continue-primary-icon"><Clock3 class="icon" /></span>
        <span class="continue-primary-copy">
          <small>Continuar desde donde te quedaste</small>
          <strong>{{ lastContextLabel }}</strong>
          <em>Abrir pase de lista</em>
        </span>
        <ArrowRight class="icon" />
      </button>

      <div v-else class="start-empty-state">
        <School class="icon-sm" />
        <span>Selecciona un plantel para guardar tu próximo acceso directo.</span>
      </div>
    </section>

    <section class="plantel-section" aria-labelledby="plantel-heading">
      <div class="section-heading-row plantel-heading-row">
        <span>
          <small>Plantel</small>
          <strong id="plantel-heading">Elige dónde pasar lista</strong>
        </span>
        <MapPin class="icon-sm" />
      </div>

      <div class="plantel-grid" aria-label="Planteles">
        <button
          v-for="plantel in planteles"
          :key="plantel.code"
          class="plantel-card"
          :class="[`accent-${plantel.accent}`, { remembered: rememberedByPlantel[plantel.code]?.grado && rememberedByPlantel[plantel.code]?.grupo }]"
          type="button"
          :aria-label="`Abrir ${plantel.title}`"
          @click="selectPlantel(plantel.code)"
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
            <ArrowRight class="icon-sm" />
          </span>
        </button>
      </div>
    </section>
  </main>
</template>
