<script setup lang="ts">
import { Award, ChevronRight, Sparkles, Star, Trophy, UsersRound } from 'lucide-vue-next'
import type { LogroCategory } from '~/types/domain'

const props = defineProps<{
  headline: string
  line: string
  totalPoints: number
  totalEvents: number
  activeStudents: number
  topCategory?: LogroCategory | null
}>()

const emit = defineEmits<{ open: [] }>()
const hasLogros = computed(() => props.totalEvents > 0 || props.totalPoints > 0 || props.activeStudents > 0)
</script>

<template>
  <section class="side-card logros-real-card class-logros-card">
    <header class="class-logros-head">
      <h3><Trophy class="icon-sm" /> Logros de la clase</h3>
      <button class="class-logros-open" type="button" @click="emit('open')" aria-label="Abrir Logros">
        <ChevronRight class="icon-sm" />
      </button>
    </header>

    <button class="class-logros-body" type="button" @click="emit('open')">
      <span class="class-logros-medal" aria-hidden="true"><Star class="icon" /></span>
      <span class="class-logros-copy">
        <strong>{{ props.headline }}</strong>
        <small v-if="props.line">{{ props.line }}</small>
        <span v-else class="class-logros-empty">Toca para registrar el primer logro.</span>
      </span>
    </button>

    <div class="class-logros-metrics" :class="{ empty: !hasLogros }" aria-label="Resumen de logros de la clase">
      <span><Award class="icon-xs" /> {{ props.totalEvents }} logros</span>
      <span><Sparkles class="icon-xs" /> {{ props.totalPoints }} pts</span>
      <span><UsersRound class="icon-xs" /> {{ props.activeStudents }} activos</span>
    </div>

    <div v-if="props.topCategory" class="class-logros-category">
      <span>Categoría fuerte</span>
      <strong>{{ props.topCategory }}</strong>
    </div>
  </section>
</template>
