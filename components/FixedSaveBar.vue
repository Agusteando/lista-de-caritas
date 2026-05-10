<script setup lang="ts">
import { Save, Sparkles } from 'lucide-vue-next'

const props = defineProps<{
  label: string
  disabled?: boolean
  pendingCount?: number
  total: number
  faltas?: number
  enfermedad?: number
}>()
const emit = defineEmits<{ save: [] }>()

const changesLabel = computed(() => {
  const count = props.faltas || props.enfermedad ? (props.faltas || 0) + (props.enfermedad || 0) : props.pendingCount || 0
  if (!count) return props.label || 'Listo'
  return `${count} cambio${count === 1 ? '' : 's'} pendiente${count === 1 ? '' : 's'}`
})
</script>

<template>
  <div class="fixed-save-area">
    <div class="fixed-save-inner">
      <div class="pending-badge" aria-hidden="true"><Sparkles class="icon" /></div>
      <div class="save-copy">
        <strong>{{ changesLabel }}</strong>
        <span v-if="(faltas || 0) || (enfermedad || 0)">
          <b class="danger">{{ faltas || 0 }} faltas</b>
          <i>•</i>
          <b class="info">{{ enfermedad || 0 }} enfermo</b>
        </span>
        <span v-else>{{ label }}</span>
      </div>
      <button class="primary-button save-button" type="button" :disabled="disabled || total === 0" @click="emit('save')">
        <Save class="icon" />
        Guardar pase de lista
        <Sparkles class="icon-sm sparkle-end" />
      </button>
    </div>
  </div>
</template>
