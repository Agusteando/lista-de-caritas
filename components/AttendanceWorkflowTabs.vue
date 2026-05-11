<script setup lang="ts">
import { ClipboardCheck, Trophy } from 'lucide-vue-next'

const props = defineProps<{
  mode: 'attendance' | 'logros'
  activeLogrosStudents: number
}>()

const emit = defineEmits<{ change: [mode: 'attendance' | 'logros'] }>()
</script>

<template>
  <nav class="class-mode-switcher" aria-label="Modo de trabajo">
    <button type="button" :class="{ active: props.mode === 'attendance' }" @click="emit('change', 'attendance')">
      <ClipboardCheck class="icon-sm" /> Asistencia
    </button>
    <button type="button" class="logros-tab" :class="{ active: props.mode === 'logros' }" @click="emit('change', 'logros')">
      <Trophy class="icon-sm" /> Logros
      <span v-if="props.activeLogrosStudents" class="mode-count">{{ props.activeLogrosStudents }}</span>
    </button>
  </nav>
</template>
