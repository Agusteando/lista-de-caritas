
import type { DefineComponent, SlotsType } from 'vue'
type IslandComponent<T> = DefineComponent<{}, {refresh: () => Promise<void>}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, SlotsType<{ fallback: { error: unknown } }>> & T

type HydrationStrategies = {
  hydrateOnVisible?: IntersectionObserverInit | true
  hydrateOnIdle?: number | true
  hydrateOnInteraction?: keyof HTMLElementEventMap | Array<keyof HTMLElementEventMap> | true
  hydrateOnMediaQuery?: string
  hydrateAfter?: number
  hydrateWhen?: boolean
  hydrateNever?: true
}
type LazyComponent<T> = DefineComponent<HydrationStrategies, {}, {}, {}, {}, {}, {}, { hydrated: () => void }> & T

interface _GlobalComponents {
  AttendanceRoster: typeof import("../../components/AttendanceRoster.vue")['default']
  AttendanceSidebar: typeof import("../../components/AttendanceSidebar.vue")['default']
  AttendanceSummaryCards: typeof import("../../components/AttendanceSummaryCards.vue")['default']
  AttendanceTopbar: typeof import("../../components/AttendanceTopbar.vue")['default']
  AttendanceViewControls: typeof import("../../components/AttendanceViewControls.vue")['default']
  AttendanceWorkflowTabs: typeof import("../../components/AttendanceWorkflowTabs.vue")['default']
  BrandHeader: typeof import("../../components/BrandHeader.vue")['default']
  ClassHero: typeof import("../../components/ClassHero.vue")['default']
  ClassLogrosCard: typeof import("../../components/ClassLogrosCard.vue")['default']
  FixedSaveBar: typeof import("../../components/FixedSaveBar.vue")['default']
  GroupIcon: typeof import("../../components/GroupIcon.vue")['default']
  GroupInfoCard: typeof import("../../components/GroupInfoCard.vue")['default']
  GroupPicker: typeof import("../../components/GroupPicker.vue")['default']
  LogrosPanel: typeof import("../../components/LogrosPanel.vue")['default']
  ModeFooter: typeof import("../../components/ModeFooter.vue")['default']
  PendingSaveCard: typeof import("../../components/PendingSaveCard.vue")['default']
  ProcessedStudentPhoto: typeof import("../../components/ProcessedStudentPhoto.vue")['default']
  SoundToggle: typeof import("../../components/SoundToggle.vue")['default']
  StudentAttendanceCard: typeof import("../../components/StudentAttendanceCard.vue")['default']
  SummarySheet: typeof import("../../components/SummarySheet.vue")['default']
  WeeklySummaryCard: typeof import("../../components/WeeklySummaryCard.vue")['default']
  NuxtWelcome: typeof import("../../node_modules/nuxt/dist/app/components/welcome.vue")['default']
  NuxtLayout: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-layout")['default']
  NuxtErrorBoundary: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
  ClientOnly: typeof import("../../node_modules/nuxt/dist/app/components/client-only")['default']
  DevOnly: typeof import("../../node_modules/nuxt/dist/app/components/dev-only")['default']
  ServerPlaceholder: typeof import("../../node_modules/nuxt/dist/app/components/server-placeholder")['default']
  NuxtLink: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-link")['default']
  NuxtLoadingIndicator: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
  NuxtTime: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
  NuxtRouteAnnouncer: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
  NuxtImg: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']
  NuxtPicture: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']
  NuxtPage: typeof import("../../node_modules/nuxt/dist/pages/runtime/page")['default']
  NoScript: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['NoScript']
  Link: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Link']
  Base: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Base']
  Title: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Title']
  Meta: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Meta']
  Style: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Style']
  Head: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Head']
  Html: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Html']
  Body: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Body']
  NuxtIsland: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-island")['default']
  LazyAttendanceRoster: LazyComponent<typeof import("../../components/AttendanceRoster.vue")['default']>
  LazyAttendanceSidebar: LazyComponent<typeof import("../../components/AttendanceSidebar.vue")['default']>
  LazyAttendanceSummaryCards: LazyComponent<typeof import("../../components/AttendanceSummaryCards.vue")['default']>
  LazyAttendanceTopbar: LazyComponent<typeof import("../../components/AttendanceTopbar.vue")['default']>
  LazyAttendanceViewControls: LazyComponent<typeof import("../../components/AttendanceViewControls.vue")['default']>
  LazyAttendanceWorkflowTabs: LazyComponent<typeof import("../../components/AttendanceWorkflowTabs.vue")['default']>
  LazyBrandHeader: LazyComponent<typeof import("../../components/BrandHeader.vue")['default']>
  LazyClassHero: LazyComponent<typeof import("../../components/ClassHero.vue")['default']>
  LazyClassLogrosCard: LazyComponent<typeof import("../../components/ClassLogrosCard.vue")['default']>
  LazyFixedSaveBar: LazyComponent<typeof import("../../components/FixedSaveBar.vue")['default']>
  LazyGroupIcon: LazyComponent<typeof import("../../components/GroupIcon.vue")['default']>
  LazyGroupInfoCard: LazyComponent<typeof import("../../components/GroupInfoCard.vue")['default']>
  LazyGroupPicker: LazyComponent<typeof import("../../components/GroupPicker.vue")['default']>
  LazyLogrosPanel: LazyComponent<typeof import("../../components/LogrosPanel.vue")['default']>
  LazyModeFooter: LazyComponent<typeof import("../../components/ModeFooter.vue")['default']>
  LazyPendingSaveCard: LazyComponent<typeof import("../../components/PendingSaveCard.vue")['default']>
  LazyProcessedStudentPhoto: LazyComponent<typeof import("../../components/ProcessedStudentPhoto.vue")['default']>
  LazySoundToggle: LazyComponent<typeof import("../../components/SoundToggle.vue")['default']>
  LazyStudentAttendanceCard: LazyComponent<typeof import("../../components/StudentAttendanceCard.vue")['default']>
  LazySummarySheet: LazyComponent<typeof import("../../components/SummarySheet.vue")['default']>
  LazyWeeklySummaryCard: LazyComponent<typeof import("../../components/WeeklySummaryCard.vue")['default']>
  LazyNuxtWelcome: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/welcome.vue")['default']>
  LazyNuxtLayout: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
  LazyNuxtErrorBoundary: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
  LazyClientOnly: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/client-only")['default']>
  LazyDevOnly: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/dev-only")['default']>
  LazyServerPlaceholder: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
  LazyNuxtLink: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-link")['default']>
  LazyNuxtLoadingIndicator: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
  LazyNuxtTime: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
  LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
  LazyNuxtImg: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']>
  LazyNuxtPicture: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']>
  LazyNuxtPage: LazyComponent<typeof import("../../node_modules/nuxt/dist/pages/runtime/page")['default']>
  LazyNoScript: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['NoScript']>
  LazyLink: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Link']>
  LazyBase: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Base']>
  LazyTitle: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Title']>
  LazyMeta: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Meta']>
  LazyStyle: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Style']>
  LazyHead: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Head']>
  LazyHtml: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Html']>
  LazyBody: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Body']>
  LazyNuxtIsland: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-island")['default']>
}

declare module 'vue' {
  export interface GlobalComponents extends _GlobalComponents { }
}

export {}
