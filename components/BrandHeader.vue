<script setup lang="ts">
import { MapPin, Shuffle } from 'lucide-vue-next'

const props = defineProps<{
  plantel?: string
  grado?: string
  grupo?: string
  compact?: boolean
}>()

const homeTarget = computed(() => {
  if (props.plantel && props.grado && props.grupo) return `/asistencia/${props.plantel}?cambiar=grupo`
  if (props.plantel) return '/'
  return '/'
})
</script>

<template>
  <div>
    <div class="brand-strip" aria-hidden="true" />
    <header class="app-header">
      <NuxtLink class="logo-lockup" :to="homeTarget">
        <span class="logo-mark caritas-mark" aria-hidden="true">
          <span class="face-dot face-dot-left" />
          <span class="face-dot face-dot-right" />
          <span class="face-smile" />
        </span>
        <span class="brand-title">
          <h1>Pase de lista</h1>
          <p>lista-de-caritas app</p>
        </span>
      </NuxtLink>
      <div v-if="plantel" class="header-context">
        <div class="context-chip" aria-label="Contexto actual">
          <MapPin class="icon-sm" />
          <span>{{ plantel }}<template v-if="grado && grupo"> · {{ grado }} {{ grupo }}</template></span>
        </div>
        <NuxtLink v-if="grado && grupo" class="context-change" :to="`/asistencia/${plantel}?cambiar=grupo`">
          <Shuffle class="icon-sm" /> Cambiar grupo
        </NuxtLink>
      </div>
    </header>
  </div>
</template>
