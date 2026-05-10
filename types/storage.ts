import type { AttendanceSubmission, GroupMeta, Student } from './domain'

export interface RosterCacheEntry {
  plantel: string
  grado: string
  grupo: string
  version?: string
  savedAt: string
  students: Student[]
  meta?: GroupMeta
}

export interface PendingAttendanceEntry {
  operationId: string
  plantel: string
  grado: string
  grupo: string
  savedAt: string
  submission: AttendanceSubmission
}
