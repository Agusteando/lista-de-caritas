<script setup lang="ts">
const props = defineProps<{
  pendingChanges: number
  pendingCount: number
  totals: { total: number; presentes: number; faltas: number; enfermedad: number; sinMarcar: number }
  statusLabel: string
  grupo: string
  title: string
  classCode: string
  detail?: string
  studentCountLabel: string
  weeklyDays: Array<{
    date: string
    label: string
    shortLabel: string
    presentes: number
    faltas: number
    enfermedad: number
    total: number
    isToday?: boolean
  }>
  logrosHeadline: string
  logrosLine: string
}>()

const emit = defineEmits<{ save: []; openLogros: [] }>()
</script>

<template>
  <aside class="attendance-sidebar" aria-label="Resumen">
    <PendingSaveCard
      :pending-changes="props.pendingChanges || props.pendingCount"
      :faltas="props.totals.faltas"
      :enfermedad="props.totals.enfermedad"
      :total="props.totals.total"
      :label="props.statusLabel"
      @save="emit('save')"
    />
    <GroupInfoCard
      :grupo="props.grupo"
      :title="props.title"
      :class-code="props.classCode"
      :detail="props.detail"
      :student-count-label="props.studentCountLabel"
    />
    <WeeklySummaryCard :days="props.weeklyDays" />
    <ClassLogrosCard :grupo="props.grupo" :headline="props.logrosHeadline" :line="props.logrosLine" @open="emit('openLogros')" />
  </aside>
</template>
