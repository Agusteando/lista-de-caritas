<script setup lang="ts">
import { ClipboardCheck, Sparkles } from 'lucide-vue-next'

defineProps<{ mode: 'attendance' | 'logros'; pendingAttendance?: boolean }>()
const emit = defineEmits<{ change: [mode: 'attendance' | 'logros'] }>()
</script>

<template>
  <nav class="bottom-nav" aria-label="Navegación principal">
    <div class="bottom-nav-inner">
      <button class="nav-item" :class="{ active: mode === 'attendance' }" type="button" @click="emit('change', 'attendance')">
        <ClipboardCheck class="icon-sm" />
        Asistencia
      </button>
      <button class="nav-item logros" :class="{ active: mode === 'logros' }" type="button" @click="emit('change', 'logros')">
        <Sparkles class="icon-sm" />
        Logros
        <span v-if="pendingAttendance" class="micro-dot" aria-hidden="true" />
      </button>
    </div>
  </nav>
</template>
