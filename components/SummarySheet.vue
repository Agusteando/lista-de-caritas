<script setup lang="ts">
import { CheckCircle2, Sparkles } from 'lucide-vue-next'

defineProps<{ presentes: number; faltas: number; enfermedad: number; total: number; plantel: string; grado: string; grupo: string }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <section class="summary-sheet complete-sheet" role="status" aria-live="polite">
    <div class="celebration-burst" aria-hidden="true">
      <span /><span /><span /><span /><span />
    </div>
    <div class="summary-sheet-header">
      <span class="status-orb completion-orb">
        <CheckCircle2 class="icon-sm" />
      </span>
      <div>
        <h3>Lista guardada</h3>
        <p>{{ plantel }} · {{ grado }} {{ grupo }}</p>
      </div>
      <Sparkles class="summary-sparkle" aria-hidden="true" />
    </div>
    <div class="summary-sheet-grid">
      <div class="summary-metric"><span>Presentes</span><strong>{{ presentes }}/{{ total }}</strong></div>
      <div class="summary-metric"><span>Faltas</span><strong>{{ faltas }}</strong></div>
      <div class="summary-metric"><span>Enfermedad</span><strong>{{ enfermedad }}</strong></div>
    </div>
    <button class="secondary-button summary-sheet-action" type="button" @click="emit('close')">Continuar</button>
  </section>
</template>
