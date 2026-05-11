<script setup lang="ts">
import { CheckSquare, Filter, List, Pencil, RefreshCcw, Search, Star } from 'lucide-vue-next'

const props = defineProps<{
  viewMode: 'exceptions' | 'one' | 'compact'
  searchTerm: string
  rosterReady: boolean
  pendingCount: number
  refreshing: boolean
  soundEnabled: boolean
}>()

const emit = defineEmits<{
  'update:searchTerm': [value: string]
  setViewMode: [mode: 'exceptions' | 'one' | 'compact']
  markAllPresent: []
  refreshRoster: []
  toggleSound: []
}>()
</script>

<template>
  <section class="attendance-controls" aria-label="Herramientas de asistencia">
    <div class="mode-segments">
      <button :class="{ active: props.viewMode === 'exceptions' }" type="button" @click="emit('setViewMode', 'exceptions')" :aria-pressed="props.viewMode === 'exceptions'">
        <Star class="icon-sm" /> Solo excepciones
      </button>
      <button :class="{ active: props.viewMode === 'one' }" type="button" @click="emit('setViewMode', 'one')" :aria-pressed="props.viewMode === 'one'">
        <Pencil class="icon-sm" /> Uno por uno
      </button>
      <button :class="{ active: props.viewMode === 'compact' }" type="button" @click="emit('setViewMode', 'compact')" :aria-pressed="props.viewMode === 'compact'">
        <List class="icon-sm" /> Compacta
      </button>
    </div>

    <div class="search-row">
      <label class="search-box">
        <Search class="icon" />
        <input :value="props.searchTerm" type="search" placeholder="Buscar alumno..." @input="emit('update:searchTerm', ($event.target as HTMLInputElement).value)">
      </label>
      <button class="filter-button" type="button"><Filter class="icon" /> Filtros</button>
    </div>

    <div class="quick-actions">
      <button class="mark-all-button" type="button" :disabled="!props.rosterReady" @click="emit('markAllPresent')">
        <CheckSquare class="icon-sm" /> Marcar todos presentes
      </button>
      <button class="quiet-button" type="button" aria-label="Actualizar lista" @click="emit('refreshRoster')">
        <RefreshCcw class="icon-sm" :class="{ 'spin-soft': props.refreshing }" />
      </button>
      <SoundToggle :enabled="props.soundEnabled" @toggle="emit('toggleSound')" />
    </div>

    <div v-if="props.pendingCount" class="safe-note compact">Pendiente de guardar</div>
    <div v-else-if="props.refreshing" class="sync-strip"><span class="sync-dot" /> Sincronizando</div>
  </section>
</template>
