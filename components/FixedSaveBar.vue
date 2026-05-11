<script setup lang="ts">
import { Save } from 'lucide-vue-next'

defineProps<{
  label: string
  disabled?: boolean
  pendingCount?: number
  total: number
  faltas?: number
  enfermedad?: number
}>()

const emit = defineEmits<{ save: [] }>()
</script>

<template>
  <div class="fixed-save-area">
    <div class="fixed-save-inner">
      <button class="primary-button save-button" type="button" :disabled="disabled || total === 0" @click="emit('save')">
        <Save class="icon" />
        Guardar pase de lista
      </button>
    </div>
  </div>
</template>
