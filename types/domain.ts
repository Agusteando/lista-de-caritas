export type AttendanceStatus = 'present' | 'absent' | 'sick' | 'unmarked'

export interface PlantelMeta {
  plantel: string
  title: string
  grados: string[]
  gruposByGrado: Record<string, string[]>
  rosterVersions: Record<string, string>
  groupMetaByKey?: Record<string, GroupMeta>
}

export interface GroupMeta {
  plantel: string
  grado: string
  grupo: string
  code: string
  turn?: string | null
  source?: string | null
  rosterVersion?: string
  rosterCount?: number
  photoCount?: number
}

export interface WeeklyAttendanceDay {
  date: string
  label: string
  shortLabel: string
  presentes: number
  faltas: number
  enfermedad: number
  total: number
  isToday: boolean
  isPreview?: boolean
}

export interface WeeklyAttendanceSummary {
  plantel: string
  grado: string
  grupo: string
  attendanceDate: string
  weekStart: string
  weekEnd: string
  days: WeeklyAttendanceDay[]
  positiveWeekStreak: number
  hasAnyAttendanceData: boolean
}

export interface ClassLogrosSummary {
  plantel: string
  grado: string
  grupo: string
  totalPoints: number
  totalEvents: number
  activeStudents: number
  topCategory?: LogroCategory | null
  attendanceDate: string
  weekStart: string
  weekEnd: string
}

export interface Student {
  id: string
  matricula?: string | null
  nombre: string
  grado: string
  grupo: string
  plantel: string
  foto?: string | null
  updatedAt?: string | null
}

export interface RetardoRecord {
  studentId: string
  nombre: string
  matricula?: string | null
  date: string
  time: string
  recordId: string
}

export interface AttendanceRecord {
  studentId: string
  nombre: string
  status: AttendanceStatus
  modalidad: '0' | '1' | '2' | '9'
  attendance: 0 | 1
}

export interface AttendanceSubmission {
  operationId: string
  plantel: string
  grado: string
  grupo: string
  submittedAt: string
  attendanceDate: string
  records: AttendanceRecord[]
  clientSummary: {
    total: number
    presentes: number
    faltas: number
    enfermedad: number
    sinMarcar: number
  }
}

export type LogroCategory =
  | 'Participación'
  | 'Esfuerzo'
  | 'Ayuda a compañeros'
  | 'Puntualidad'
  | 'Buena actitud'
  | 'Trabajo completo'
  | 'Lectura'
  | 'Liderazgo'

export interface LogroEvent {
  operationId: string
  studentId: string
  plantel: string
  grado: string
  grupo: string
  category: LogroCategory
  points: number
  featured: boolean
  streakBonus: number
  weeklyMilestoneBonus: number
  awardedAt: string
}

export interface StudentLogrosState {
  studentId: string
  pointsThisWeek: number
  categoryPoints: Partial<Record<LogroCategory, number>>
  recent: Array<{ category: LogroCategory; points: number; awardedAt: string }>
  streaks: Record<string, number>
  badges: Array<{ category: LogroCategory; level: 'Bronce' | 'Plata' | 'Oro' | 'Diamante' }>
  bestCategory?: LogroCategory
}
