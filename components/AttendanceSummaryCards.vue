<script setup lang="ts">
import { Check, Thermometer, UserMinus } from 'lucide-vue-next'

defineProps<{ presentes: number; faltas: number; enfermedad: number; total: number }>()
</script>

<template>
  <section class="attendance-metrics" aria-label="Resumen del grupo">
    <article class="metric-cell metric-present">
      <span class="metric-icon"><Check class="icon" /></span>
      <strong>{{ presentes }}</strong>
      <small>Presentes</small>
    </article>
    <article class="metric-cell metric-absent">
      <span class="metric-icon"><UserMinus class="icon" /></span>
      <strong>{{ faltas }}</strong>
      <small>Faltas</small>
    </article>
    <article class="metric-cell metric-sick">
      <span class="metric-icon"><Thermometer class="icon" /></span>
      <strong>{{ enfermedad }}</strong>
      <small>Enfermo</small>
    </article>
  </section>
</template>
