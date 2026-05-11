<script setup lang="ts">
import type { AttendanceStatus, RetardoRecord, Student } from '~/types/domain'

const props = defineProps<{
  students: Student[]
  attendance: Record<string, AttendanceStatus>
  viewMode: 'exceptions' | 'one' | 'compact'
  interactionMode: 'exceptions' | 'one'
  showSkeleton: boolean
  recentlyChangedStudentId?: string | null
  retardos: Record<string, RetardoRecord>
}>()

const emit = defineEmits<{ setStatus: [studentId: string, status: AttendanceStatus] }>()
</script>

<template>
  <section class="roster-grid reference-density" :class="`view-${props.viewMode}`" aria-label="Lista de alumnos">
    <StudentAttendanceCard
      v-for="(student, index) in props.students"
      :key="student.id"
      :student="student"
      :index="index + 1"
      :status="props.attendance[student.id] || 'unmarked'"
      :highlighted="props.recentlyChangedStudentId === student.id || props.recentlyChangedStudentId === 'all'"
      :retardo="props.retardos[student.id]"
      :interaction-mode="props.interactionMode"
      @set-status="(studentId, status) => emit('setStatus', studentId, status)"
    />

    <template v-if="props.showSkeleton">
      <article v-for="index in 10" :key="`skeleton-${index}`" class="student-card skeleton-card" aria-hidden="true">
        <div class="student-main-button">
          <span class="rank-bubble">{{ index }}</span>
          <span class="student-avatar-ring skeleton-avatar" />
          <span class="student-info"><span class="skeleton-line wide" /><span class="skeleton-line short" /><span class="skeleton-pill" /></span>
        </div>
      </article>
    </template>

    <div v-if="!props.students.length && !props.showSkeleton" class="empty-state"><strong>Lista en preparación</strong></div>
  </section>
</template>
