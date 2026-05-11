<script setup lang="ts">
import { ArrowRight, Building2, CheckCircle2, Clock3, GraduationCap, MapPin, School, Sparkles } from 'lucide-vue-next'

const planteles = [
  { code: 'PM', title: 'Primaria Metepec', level: 'Primaria', city: 'Metepec', accent: 'green' },
  { code: 'PT', title: 'Primaria Toluca', level: 'Primaria', city: 'Toluca', accent: 'gold' },
  { code: 'SM', title: 'Secundaria Metepec', level: 'Secundaria', city: 'Metepec', accent: 'blue' },
  { code: 'ST', title: 'Secundaria Toluca', level: 'Secundaria', city: 'Toluca', accent: 'rose' },
  { code: 'PREEM', title: 'Preescolar Metepec', level: 'Preescolar', city: 'Metepec', accent: 'violet' },
  { code: 'PREET', title: 'Preescolar Toluca', level: 'Preescolar', city: 'Toluca', accent: 'green' }
]

const { getLastContext, getRememberedGroup, rememberPlantel } = usePlantelMemory()
const lastContext = ref<ReturnType<typeof getLastContext> | null>(null)
const rememberedByPlantel = ref<Record<string, { grado?: string; grupo?: string }>>({})

onMounted(() => {
  lastContext.value = getLastContext()
  rememberedByPlantel.value = Object.fromEntries(
    planteles.map((plantel) => [plantel.code, getRememberedGroup(plantel.code) || {}])
  )
})

const rememberedCount = computed(() => Object.values(rememberedByPlantel.value).filter((value) => value.grado && value.grupo).length)
const levelCount = computed(() => new Set(planteles.map((plantel) => plantel.level)).size)
const cityCount = computed(() => new Set(planteles.map((plantel) => plantel.city)).size)
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

    <section class="selection-hero-card plantel-hero-card">
      <div class="selection-hero-logo">
        <AnimatedLogo variant="hero" />
      </div>

      <div class="selection-hero-copy">
        <span class="hero-eyebrow"><Sparkles class="icon-sm" /> lista-de-caritas app</span>
        <h2>Pase de lista</h2>
        <p>Elige plantel, confirma el grupo y entra al flujo diario con el menor número de pasos.</p>
      </div>

      <button
        v-if="lastContext?.plantel"
        class="continue-card priority-card"
        type="button"
        @click="selectPlantel(lastContext.plantel)"
      >
        <span class="continue-icon"><Clock3 class="icon-sm" /></span>
        <span>
          <strong>Continuar donde te quedaste</strong>
          <small>{{ lastContextLabel }}</small>
        </span>
        <ArrowRight class="icon-sm" />
      </button>

      <div class="selection-hero-stats" aria-label="Resumen de selección">
        <article><Building2 class="icon-sm" /><strong>{{ planteles.length }}</strong><span>planteles</span></article>
        <article><School class="icon-sm" /><strong>{{ levelCount }}</strong><span>niveles</span></article>
        <article><MapPin class="icon-sm" /><strong>{{ cityCount }}</strong><span>sedes</span></article>
        <article><CheckCircle2 class="icon-sm" /><strong>{{ rememberedCount }}</strong><span>guardados</span></article>
      </div>
    </section>

    <section class="plantel-section" aria-labelledby="plantel-heading">
      <div class="section-heading-row plantel-heading-row">
        <span>
          <small>Plantel</small>
          <strong id="plantel-heading">Selecciona dónde pasar lista</strong>
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
            <small class="plantel-code">{{ plantel.code }}</small>
            <strong>{{ plantel.title }}</strong>
            <small>{{ plantel.level }} · {{ plantel.city }}</small>
            <em v-if="rememberedLabel(plantel.code)"><CheckCircle2 class="icon-xs" /> {{ rememberedLabel(plantel.code) }}</em>
          </span>
          <span class="plantel-action">
            <ArrowRight class="icon-sm" />
          </span>
        </button>
      </div>
    </section>
  </main>
</template>
