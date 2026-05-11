<script setup lang="ts">
import { Star, Trophy } from 'lucide-vue-next'

const props = defineProps<{
  grupo: string
  headline: string
  line: string
}>()

const emit = defineEmits<{ open: [] }>()
</script>

<template>
  <section class="side-card logros-real-card restored-logros-card">
    <h3><Trophy class="icon-sm" /> Logros de la clase</h3>
    <div class="logros-celebration-body">
      <span class="logros-star-medal" aria-hidden="true"><Star class="icon" /></span>
      <div class="logros-celebration-copy">
        <strong>{{ props.headline }}</strong>
        <p>{{ props.line }}</p>
        <button class="open-logros-button" type="button" @click="emit('open')">Abrir Logros</button>
      </div>
      <div class="logros-group-mascot" aria-hidden="true">
        <GroupIcon :label="props.grupo" tone="green" decorative />
      </div>
    </div>
  </section>
</template>
