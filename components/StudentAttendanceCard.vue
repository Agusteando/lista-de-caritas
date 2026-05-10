<script setup lang="ts">
import { Check, ChevronDown, Circle, Clock3, Thermometer, UserMinus } from 'lucide-vue-next'
import type { AttendanceStatus, RetardoRecord, Student } from '~/types/domain'

const props = defineProps<{
  student: Student
  status: AttendanceStatus
  highlighted?: boolean
  index?: number
  retardo?: RetardoRecord
}>()

const emit = defineEmits<{ setStatus: [studentId: string, status: AttendanceStatus] }>()

const label = computed(() => {
  if (props.status === 'present') return 'Presente'
  if (props.status === 'absent') return 'Falta'
  if (props.status === 'sick') return 'Enfermo'
  return 'Sin marcar'
})

const statusClass = computed(() => ({
  'status-present': props.status === 'present',
  'status-absent': props.status === 'absent',
  'status-sick': props.status === 'sick',
  'status-unmarked': props.status === 'unmarked',
  'selection-pop': props.highlighted
}))

const tone = computed(() => {
  if (props.status === 'absent') return 'red'
  if (props.status === 'sick') return 'blue'
  if (props.status === 'unmarked') return 'neutral'
  return 'green'
})

const cycle = () => {
  const next: Record<AttendanceStatus, AttendanceStatus> = {
    unmarked: 'present',
    present: 'absent',
    absent: 'sick',
    sick: 'present'
  }
  emit('setStatus', props.student.id, next[props.status])
}
</script>

<template>
  <article class="student-card" :class="statusClass">
    <button type="button" class="student-main-button" :aria-label="`Cambiar asistencia de ${student.nombre}. Estado actual: ${label}`" @click="cycle">
      <span class="rank-bubble">{{ index }}</span>
      <span class="student-avatar-ring">
        <ProcessedStudentPhoto :src="student.foto" :alt="student.nombre" :cache-key="student.matricula || student.id" :group-label="student.grupo" />
      </span>
      <span class="student-info">
        <strong class="student-name">{{ student.nombre }}</strong>
        <span class="student-line">
          <GroupIcon :label="student.grupo" :tone="tone" />
          <span v-if="retardo" class="retardo-chip"><Clock3 class="icon-xs" /> Retardo {{ retardo.time.slice(0, 5) }}</span>
        </span>
        <span class="status-control" :class="tone">
          <Check v-if="status === 'present'" class="icon-sm" />
          <UserMinus v-else-if="status === 'absent'" class="icon-sm" />
          <Thermometer v-else-if="status === 'sick'" class="icon-sm" />
          <Circle v-else class="icon-sm" />
          {{ label }}
          <ChevronDown class="icon-sm chevron" />
        </span>
      </span>
      <span class="card-sparkles" aria-hidden="true" />
    </button>
  </article>
</template>
