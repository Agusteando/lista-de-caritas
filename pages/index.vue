<script setup lang="ts">
import { ArrowRight, Building2, Clock3, Sparkles } from 'lucide-vue-next'

const planteles = [
  { code: 'PM', title: 'Primaria Metepec', accent: 'green' },
  { code: 'PT', title: 'Primaria Toluca', accent: 'gold' },
  { code: 'SM', title: 'Secundaria Metepec', accent: 'blue' },
  { code: 'ST', title: 'Secundaria Toluca', accent: 'rose' },
  { code: 'PREEM', title: 'Preescolar ISSSTE Metepec', accent: 'violet' },
  { code: 'PREET', title: 'Preescolar ISSSTE Toluca', accent: 'green' }
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
  <main class="page-shell landing-shell">
    <BrandHeader />

    <section class="hero-card landing-hero compact-copy">
      <span class="hero-eyebrow"><Sparkles class="icon-sm" /> lista-de-caritas app</span>
      <h2>Pase de lista</h2>

      <button
        v-if="lastContext?.plantel"
        class="continue-card priority-card"
        type="button"
        @click="selectPlantel(lastContext.plantel)"
      >
        <span class="continue-icon"><Clock3 class="icon-sm" /></span>
        <span>
          <strong>Continuar</strong>
          <small>{{ lastContext.plantel }}<template v-if="lastContext.grado && lastContext.grupo"> · {{ lastContext.grado }} {{ lastContext.grupo }}</template></small>
        </span>
        <ArrowRight class="icon-sm" />
      </button>
    </section>

    <section class="plantel-grid" aria-label="Planteles">
      <button
        v-for="plantel in planteles"
        :key="plantel.code"
        class="plantel-card"
        :class="[`accent-${plantel.accent}`, { remembered: rememberedByPlantel[plantel.code]?.grado && rememberedByPlantel[plantel.code]?.grupo }]"
        type="button"
        @click="selectPlantel(plantel.code)"
      >
        <span class="plantel-icon"><Building2 class="icon" /></span>
        <span class="plantel-copy">
          <strong>{{ plantel.title }}</strong>
          <small>
            {{ plantel.code }}
            <template v-if="rememberedByPlantel[plantel.code]?.grado && rememberedByPlantel[plantel.code]?.grupo">
              · {{ rememberedByPlantel[plantel.code].grado }} {{ rememberedByPlantel[plantel.code].grupo }}
            </template>
          </small>
        </span>
        <ArrowRight class="icon-sm" />
      </button>
    </section>
  </main>
</template>
