<script setup lang="ts">
import { ArrowLeft, MoreHorizontal, Shuffle } from 'lucide-vue-next'

const props = defineProps<{
  plantel: string
  todayLabel: string
}>()
</script>

<template>
  <header class="attendance-topbar">
    <div class="topbar-left">
      <NuxtLink class="round-button back" :to="`/asistencia/${props.plantel}?cambiar=grupo`" aria-label="Cambiar grupo">
        <ArrowLeft class="icon" />
      </NuxtLink>
      <span class="round-button soft asset-button clipboard-asset" aria-hidden="true">
        <img class="reference-topbar-image" src="/reference-assets/clipboard.png" alt="" draggable="false">
      </span>
      <div class="attendance-title">
        <h1>Pase de lista <span aria-hidden="true">🌿</span></h1>
        <small>lista-de-caritas app</small>
      </div>
    </div>

    <div class="topbar-actions">
      <button class="date-pill reference-date-pill" type="button">
        <span class="reference-icon reference-icon-calendar" aria-hidden="true" />
        {{ props.todayLabel }}
      </button>
      <button class="round-button soft" type="button" aria-label="Más">
        <MoreHorizontal class="icon" />
      </button>
      <NuxtLink class="change-group-pill" :to="`/asistencia/${props.plantel}?cambiar=grupo`">
        <Shuffle class="icon-sm" /> Cambiar grupo
      </NuxtLink>
    </div>
  </header>
</template>
