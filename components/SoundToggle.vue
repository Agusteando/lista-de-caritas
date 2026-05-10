<script setup lang="ts">
import { Volume2, VolumeX } from 'lucide-vue-next'

defineProps<{ enabled: boolean }>()
const emit = defineEmits<{ toggle: [] }>()
</script>

<template>
  <button class="sound-button" type="button" :aria-pressed="enabled" @click="emit('toggle')">
    <Volume2 v-if="enabled" class="icon-sm" />
    <VolumeX v-else class="icon-sm" />
    Sonido
  </button>
</template>
