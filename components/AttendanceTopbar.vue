<script setup lang="ts">
import { ArrowLeft, CheckSquare, MoreHorizontal, RefreshCcw, Shuffle, Volume2, VolumeX } from 'lucide-vue-next'

const props = defineProps<{
  plantel: string
  todayLabel: string
  rosterReady: boolean
  refreshing: boolean
  soundEnabled: boolean
}>()

const emit = defineEmits<{
  refreshRoster: []
  markAllPresent: []
  toggleSound: []
}>()

const menuOpen = ref(false)
const menuRoot = ref<HTMLElement | null>(null)

const closeMenu = () => { menuOpen.value = false }

const runMenuAction = (action: () => void) => {
  action()
  closeMenu()
}

const handleDocumentClick = (event: MouseEvent) => {
  const target = event.target as Node | null
  if (!target || !menuRoot.value || menuRoot.value.contains(target)) return
  closeMenu()
}

onMounted(() => document.addEventListener('click', handleDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', handleDocumentClick))
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
      <button class="date-pill reference-date-pill" type="button" aria-label="Fecha del pase de lista">
        <span class="reference-icon reference-icon-calendar" aria-hidden="true" />
        {{ props.todayLabel }}
      </button>
      <div ref="menuRoot" class="more-menu-wrap" @keydown.esc="closeMenu">
        <button class="round-button soft" type="button" aria-haspopup="menu" :aria-expanded="menuOpen" aria-label="Más opciones" @click="menuOpen = !menuOpen">
          <MoreHorizontal class="icon" />
        </button>
        <div v-if="menuOpen" class="topbar-menu" role="menu">
          <button type="button" role="menuitem" @click="runMenuAction(() => emit('refreshRoster'))">
            <RefreshCcw class="icon-sm" :class="{ 'spin-soft': props.refreshing }" /> Actualizar lista
          </button>
          <button type="button" role="menuitem" :disabled="!props.rosterReady" @click="runMenuAction(() => emit('markAllPresent'))">
            <CheckSquare class="icon-sm" /> Marcar todos presentes
          </button>
          <button type="button" role="menuitem" @click="runMenuAction(() => emit('toggleSound'))">
            <Volume2 v-if="props.soundEnabled" class="icon-sm" />
            <VolumeX v-else class="icon-sm" />
            {{ props.soundEnabled ? 'Sonido activado' : 'Sonido desactivado' }}
          </button>
        </div>
      </div>
      <NuxtLink class="change-group-pill" :to="`/asistencia/${props.plantel}?cambiar=grupo`">
        <Shuffle class="icon-sm" /> Cambiar grupo
      </NuxtLink>
    </div>
  </header>
</template>
