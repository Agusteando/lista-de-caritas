<script setup lang="ts">
const {
  activeLogrosStudents,
  attendance,
  awardLogro,
  classCode,
  classDetail,
  displayWeeklyDays,
  grado,
  grupo,
  groupTitle,
  logros,
  logrosClassHeadline,
  logrosClassLine,
  logroSummary,
  markAllPresent,
  mode,
  pendingCount,
  pendingExceptionCount,
  plantel,
  recentlyChangedStudentId,
  refreshRoster,
  refreshing,
  retardos,
  rosterReady,
  saveAttendance,
  searchTerm,
  setMode,
  setStatus,
  showRosterSkeleton,
  sounds,
  status,
  studentCountLabel,
  students,
  summaryVisible,
  todayLabel,
  totals,
  visibleStudents
} = useAttendanceScreen()
</script>

<template>
  <main class="attendance-shell">
    <AttendanceTopbar
      :plantel="plantel"
      :today-label="todayLabel"
      :roster-ready="rosterReady"
      :refreshing="refreshing"
      :sound-enabled="sounds.enabled.value"
      @refresh-roster="refreshRoster"
      @mark-all-present="markAllPresent"
      @toggle-sound="sounds.setEnabled(!sounds.enabled.value)"
    />

    <div class="attendance-layout">
      <section class="attendance-main">
        <ClassHero
          :grupo="grupo"
          :title="groupTitle"
          :class-code="classCode"
          :detail="classDetail"
          :student-count-label="studentCountLabel"
        />

        <AttendanceSummaryCards
          :presentes="totals.presentes"
          :faltas="totals.faltas"
          :enfermedad="totals.enfermedad"
          :total="totals.total"
        />

        <AttendanceWorkflowTabs
          :mode="mode"
          :active-logros-students="activeLogrosStudents"
          @change="setMode"
        />

        <template v-if="mode === 'attendance'">
          <AttendanceViewControls v-model:search-term="searchTerm" />

          <AttendanceRoster
            :students="visibleStudents"
            :attendance="attendance"
            :show-skeleton="showRosterSkeleton"
            :recently-changed-student-id="recentlyChangedStudentId"
            :retardos="retardos"
            @set-status="setStatus"
          />
        </template>

        <LogrosPanel
          v-else
          :students="students"
          :states="logros.states.value"
          :featured-category="logros.featuredCategory.value"
          :rankings="logros.rankings.value"
          :group-label="grupo"
          :syncing="logros.syncing.value"
          @award="awardLogro"
        />
      </section>

      <AttendanceSidebar
        :pending-changes="pendingExceptionCount"
        :pending-count="pendingCount"
        :totals="totals"
        :status-label="status.label.value"
        :grupo="grupo"
        :title="groupTitle"
        :class-code="classCode"
        :detail="classDetail"
        :student-count-label="studentCountLabel"
        :weekly-days="displayWeeklyDays"
        :logros-headline="logrosClassHeadline"
        :logros-line="logrosClassLine"
        :logros-total-points="logroSummary.totalPoints"
        :logros-active-students="logroSummary.activeStudents"
        @save="saveAttendance"
        @open-logros="setMode('logros')"
      />
    </div>

    <SummarySheet
      v-if="summaryVisible"
      :presentes="totals.presentes"
      :faltas="totals.faltas"
      :enfermedad="totals.enfermedad"
      :total="totals.total"
      :plantel="plantel"
      :grado="grado"
      :grupo="grupo"
      @close="summaryVisible = false"
    />

    <FixedSaveBar
      :label="status.label.value"
      :pending-count="pendingCount"
      :faltas="totals.faltas"
      :enfermedad="totals.enfermedad"
      :total="totals.total"
      @save="saveAttendance"
    />
    <ModeFooter :mode="mode" :pending-attendance="pendingCount > 0" @change="setMode" />
  </main>
</template>
