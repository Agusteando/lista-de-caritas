
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


export const AttendanceRoster: typeof import("../components/AttendanceRoster.vue")['default']
export const AttendanceSidebar: typeof import("../components/AttendanceSidebar.vue")['default']
export const AttendanceSummaryCards: typeof import("../components/AttendanceSummaryCards.vue")['default']
export const AttendanceTopbar: typeof import("../components/AttendanceTopbar.vue")['default']
export const AttendanceViewControls: typeof import("../components/AttendanceViewControls.vue")['default']
export const AttendanceWorkflowTabs: typeof import("../components/AttendanceWorkflowTabs.vue")['default']
export const BrandHeader: typeof import("../components/BrandHeader.vue")['default']
export const ClassHero: typeof import("../components/ClassHero.vue")['default']
export const ClassLogrosCard: typeof import("../components/ClassLogrosCard.vue")['default']
export const FixedSaveBar: typeof import("../components/FixedSaveBar.vue")['default']
export const GroupIcon: typeof import("../components/GroupIcon.vue")['default']
export const GroupInfoCard: typeof import("../components/GroupInfoCard.vue")['default']
export const GroupPicker: typeof import("../components/GroupPicker.vue")['default']
export const LogrosPanel: typeof import("../components/LogrosPanel.vue")['default']
export const ModeFooter: typeof import("../components/ModeFooter.vue")['default']
export const PendingSaveCard: typeof import("../components/PendingSaveCard.vue")['default']
export const ProcessedStudentPhoto: typeof import("../components/ProcessedStudentPhoto.vue")['default']
export const SoundToggle: typeof import("../components/SoundToggle.vue")['default']
export const StudentAttendanceCard: typeof import("../components/StudentAttendanceCard.vue")['default']
export const SummarySheet: typeof import("../components/SummarySheet.vue")['default']
export const WeeklySummaryCard: typeof import("../components/WeeklySummaryCard.vue")['default']
export const NuxtWelcome: typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']
export const NuxtLayout: typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']
export const NuxtErrorBoundary: typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
export const ClientOnly: typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']
export const DevOnly: typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']
export const ServerPlaceholder: typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']
export const NuxtLink: typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']
export const NuxtLoadingIndicator: typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
export const NuxtTime: typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
export const NuxtRouteAnnouncer: typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
export const NuxtImg: typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']
export const NuxtPicture: typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']
export const NuxtPage: typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']
export const NoScript: typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']
export const Link: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']
export const Base: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']
export const Title: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']
export const Meta: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']
export const Style: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']
export const Head: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']
export const Html: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']
export const Body: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']
export const NuxtIsland: typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']
export const LazyAttendanceRoster: LazyComponent<typeof import("../components/AttendanceRoster.vue")['default']>
export const LazyAttendanceSidebar: LazyComponent<typeof import("../components/AttendanceSidebar.vue")['default']>
export const LazyAttendanceSummaryCards: LazyComponent<typeof import("../components/AttendanceSummaryCards.vue")['default']>
export const LazyAttendanceTopbar: LazyComponent<typeof import("../components/AttendanceTopbar.vue")['default']>
export const LazyAttendanceViewControls: LazyComponent<typeof import("../components/AttendanceViewControls.vue")['default']>
export const LazyAttendanceWorkflowTabs: LazyComponent<typeof import("../components/AttendanceWorkflowTabs.vue")['default']>
export const LazyBrandHeader: LazyComponent<typeof import("../components/BrandHeader.vue")['default']>
export const LazyClassHero: LazyComponent<typeof import("../components/ClassHero.vue")['default']>
export const LazyClassLogrosCard: LazyComponent<typeof import("../components/ClassLogrosCard.vue")['default']>
export const LazyFixedSaveBar: LazyComponent<typeof import("../components/FixedSaveBar.vue")['default']>
export const LazyGroupIcon: LazyComponent<typeof import("../components/GroupIcon.vue")['default']>
export const LazyGroupInfoCard: LazyComponent<typeof import("../components/GroupInfoCard.vue")['default']>
export const LazyGroupPicker: LazyComponent<typeof import("../components/GroupPicker.vue")['default']>
export const LazyLogrosPanel: LazyComponent<typeof import("../components/LogrosPanel.vue")['default']>
export const LazyModeFooter: LazyComponent<typeof import("../components/ModeFooter.vue")['default']>
export const LazyPendingSaveCard: LazyComponent<typeof import("../components/PendingSaveCard.vue")['default']>
export const LazyProcessedStudentPhoto: LazyComponent<typeof import("../components/ProcessedStudentPhoto.vue")['default']>
export const LazySoundToggle: LazyComponent<typeof import("../components/SoundToggle.vue")['default']>
export const LazyStudentAttendanceCard: LazyComponent<typeof import("../components/StudentAttendanceCard.vue")['default']>
export const LazySummarySheet: LazyComponent<typeof import("../components/SummarySheet.vue")['default']>
export const LazyWeeklySummaryCard: LazyComponent<typeof import("../components/WeeklySummaryCard.vue")['default']>
export const LazyNuxtWelcome: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']>
export const LazyNuxtLayout: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
export const LazyNuxtErrorBoundary: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
export const LazyClientOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']>
export const LazyDevOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']>
export const LazyServerPlaceholder: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
export const LazyNuxtLink: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']>
export const LazyNuxtLoadingIndicator: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
export const LazyNuxtTime: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
export const LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
export const LazyNuxtImg: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']>
export const LazyNuxtPicture: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']>
export const LazyNuxtPage: LazyComponent<typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']>
export const LazyNoScript: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']>
export const LazyLink: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']>
export const LazyBase: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']>
export const LazyTitle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']>
export const LazyMeta: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']>
export const LazyStyle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']>
export const LazyHead: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']>
export const LazyHtml: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']>
export const LazyBody: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']>
export const LazyNuxtIsland: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']>

export const componentNames: string[]
