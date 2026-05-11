<script setup lang="ts">
import { CheckCircle2, Save, Star } from 'lucide-vue-next'

const props = defineProps<{
  pendingChanges: number
  faltas: number
  enfermedad: number
  total: number
  label: string
}>()

const emit = defineEmits<{ save: [] }>()

const pendingLabel = computed(() => `${props.pendingChanges} ${props.pendingChanges === 1 ? 'cambio pendiente' : 'cambios pendientes'}`)
</script>

<template>
  <section class="side-card save-side-card">
    <div class="pending-badge" aria-hidden="true"><Star class="icon" /></div>
    <div class="pending-copy">
      <h3>Cambios pendientes</h3>
      <div class="pending-count-panel">
        <strong>{{ pendingLabel }}</strong>
        <p><b class="danger">{{ props.faltas }} faltas</b> <i>•</i> <b class="info">{{ props.enfermedad }} enfermo</b></p>
      </div>
    </div>
    <button class="primary-button save-button desktop" type="button" :disabled="props.total === 0" @click="emit('save')">
      <Save class="icon" />
      Guardar pase de lista
    </button>
    <small v-if="props.label" class="save-status-line"><CheckCircle2 class="icon-xs" /> {{ props.label }}</small>
  </section>
</template>
