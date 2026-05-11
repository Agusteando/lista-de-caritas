<script setup lang="ts">
import { Users } from 'lucide-vue-next'

const props = defineProps<{
  grupo: string
  title: string
  classCode: string
  detail?: string
  studentCountLabel: string
}>()
</script>

<template>
  <section class="side-card group-info-card">
    <h3>Información del grupo</h3>
    <p><GroupIcon :label="props.grupo" tone="green" /> {{ props.title }}</p>
    <p><span>{{ props.classCode }}</span><template v-if="props.detail"><i>•</i>{{ props.detail }}</template></p>
    <p><Users class="icon-sm" /> {{ props.studentCountLabel }} alumnos</p>
  </section>
</template>
