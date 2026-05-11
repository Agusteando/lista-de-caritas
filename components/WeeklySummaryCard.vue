<script setup lang="ts">
import { CalendarDays, CheckCircle2, Thermometer, UserRoundX } from 'lucide-vue-next'

type WeeklyDisplayDay = {
  date: string
  label: string
  shortLabel: string
  presentes: number
  faltas: number
  enfermedad: number
  total: number
  isToday?: boolean
}

const props = defineProps<{ days: WeeklyDisplayDay[] }>()
</script>

<template>
  <section class="side-card weekly-real-card">
    <h3><CalendarDays class="icon-sm" /> Resumen semanal</h3>
    <div class="weekly-grid restored-weekly-grid">
      <span />
      <strong v-for="day in props.days" :key="`h-${day.date}`" :class="{ today: day.isToday }">{{ day.label }}<small>{{ day.shortLabel }}</small></strong>
      <span class="week-status-icon present"><CheckCircle2 class="icon-sm" /></span><b v-for="day in props.days" :key="`p-${day.date}`" :class="{ today: day.isToday }">{{ day.total ? day.presentes : '–' }}</b>
      <span class="week-status-icon absent"><UserRoundX class="icon-sm" /></span><b v-for="day in props.days" :key="`a-${day.date}`" :class="{ today: day.isToday }">{{ day.total ? day.faltas : '–' }}</b>
      <span class="week-status-icon sick"><Thermometer class="icon-sm" /></span><b v-for="day in props.days" :key="`s-${day.date}`" :class="{ today: day.isToday }">{{ day.total ? day.enfermedad : '–' }}</b>
    </div>
  </section>
</template>
