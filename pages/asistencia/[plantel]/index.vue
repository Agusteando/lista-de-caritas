<script setup lang="ts">
import { RefreshCcw } from 'lucide-vue-next'
import type { PlantelMeta } from '~/types/domain'

const route = useRoute()
const plantel = computed(() => String(route.params.plantel || '').toUpperCase())
const forceGroupSelection = computed(() => {
  const raw = String(route.query.cambiar || route.query.seleccionar || '')
  return ['grupo', 'grupos', '1', 'true'].includes(raw.toLowerCase())
})
const { getRememberedGroup, rememberPlantel } = usePlantelMemory()
const { readPlantelMetaCache, writePlantelMetaCache } = useRosterCache()
const remembered = ref<{ grado?: string; grupo?: string } | null>(null)
const cachedMeta = ref<PlantelMeta | null>(null)
const refreshing = ref(false)

const { data: fetchedMeta, pending, execute } = await useFetch<PlantelMeta>(() => `/api/planteles/${plantel.value}/bootstrap`, {
  key: `bootstrap-${plantel.value}`,
  server: false,
  immediate: false,
  default: () => null
})

const meta = computed(() => fetchedMeta.value || cachedMeta.value)

onMounted(async () => {
  rememberPlantel(plantel.value)
  remembered.value = getRememberedGroup(plantel.value)
  if (!forceGroupSelection.value && remembered.value?.grado && remembered.value?.grupo) {
    navigateTo(`/asistencia/${plantel.value}/${encodeURIComponent(remembered.value.grado)}/${encodeURIComponent(remembered.value.grupo)}`)
    return
  }

  cachedMeta.value = readPlantelMetaCache(plantel.value)
  refreshing.value = true
  try {
    await execute()
    if (fetchedMeta.value) writePlantelMetaCache(plantel.value, fetchedMeta.value)
  } finally {
    refreshing.value = false
  }
})
</script>

<template>
  <main class="page-shell group-shell">
    <BrandHeader :plantel="plantel" />
    <GroupPicker v-if="meta" :plantel="plantel" :meta="meta" :remembered="remembered" :refreshing="refreshing || pending" />
    <section v-else class="hero-card group-journey-card compact-copy">
      <span class="hero-eyebrow"><RefreshCcw class="icon-sm spin-soft" /> {{ plantel }}</span>
      <h2>Grupos</h2>
      <div class="group-loading-grid" aria-hidden="true">
        <div v-for="index in 6" :key="index" class="group-card skeleton-group-card">
          <div class="skeleton-line wide" />
          <div class="skeleton-line short" />
        </div>
      </div>
    </section>
      <SelectionFooter />
  </main>
</template>
