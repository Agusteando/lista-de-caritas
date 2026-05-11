<script setup lang="ts">
import { Star } from 'lucide-vue-next'

const props = defineProps<{
  pendingChanges: number
  faltas: number
  enfermedad: number
  total: number
  label: string
}>()

const emit = defineEmits<{ save: [] }>()
</script>

<template>
  <section class="side-card save-side-card">
    <div class="pending-badge"><Star class="icon" /></div>
    <div>
      <h3>{{ props.pendingChanges }} cambios pendientes</h3>
      <p><b class="danger">{{ props.faltas }} faltas</b> <i>•</i> <b class="info">{{ props.enfermedad }} enfermo</b></p>
    </div>
    <button class="primary-button save-button desktop" type="button" :disabled="props.total === 0" @click="emit('save')">Guardar pase de lista</button>
    <small class="ready-line">{{ props.label }}</small>
  </section>
</template>
