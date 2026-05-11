<script setup lang="ts">
import { School, Shuffle } from 'lucide-vue-next'
import { getPlantelByCode } from '~/utils/planteles'

const props = defineProps<{
  plantel?: string
  grado?: string
  grupo?: string
  compact?: boolean
}>()

const homeTarget = computed(() => {
  if (props.plantel && props.grado && props.grupo) return `/asistencia/${props.plantel}?cambiar=grupo`
  return '/'
})

const plantelMeta = computed(() => getPlantelByCode(props.plantel))
const contextTitle = computed(() => plantelMeta.value?.title || 'Selecciona tu plantel')
const contextSubtitle = computed(() => {
  if (props.grado && props.grupo) return `${props.grado} · ${props.grupo}`
  if (plantelMeta.value) return 'Escuela'
  return 'Elige escuela'
})
</script>

<template>
  <div>
    <div class="brand-strip" aria-hidden="true" />
    <header class="app-header-bleed">
      <div class="app-header app-header-selection">
        <div class="header-left-cluster">
          <NuxtLink class="logo-lockup" :to="homeTarget">
            <BrandLogo />
            <span class="brand-wordmark" aria-label="lista de caritas">
              <span class="wordmark-main">lista</span>
              <span class="wordmark-accent">de caritas</span>
            </span>
          </NuxtLink>

          <template v-if="plantel">
            <span class="header-divider" aria-hidden="true" />

            <div class="header-campus-card" aria-label="Plantel actual">
              <span class="campus-icon"><School class="icon-sm" /></span>
              <span class="campus-copy">
                <strong>{{ contextTitle }}</strong>
                <small>{{ contextSubtitle }}</small>
              </span>
            </div>
          </template>
        </div>

        <div v-if="plantel && grado && grupo" class="header-right-cluster">
          <NuxtLink class="header-utility-button change-group-link" :to="`/asistencia/${plantel}?cambiar=grupo`">
            <Shuffle class="icon-sm" />
            <span>Cambiar grupo</span>
          </NuxtLink>
        </div>
      </div>
    </header>
  </div>
</template>
