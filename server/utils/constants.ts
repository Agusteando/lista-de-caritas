export const PLANTELES: Record<string, string> = {
  PM: 'Primaria Metepec',
  PT: 'Primaria Toluca',
  SM: 'Secundaria Metepec',
  ST: 'Secundaria Toluca',
  PREEM: 'Preescolar ISSSTE Metepec',
  PREET: 'Preescolar ISSSTE Toluca'
}

export const GRADE_ORDER = ['primero', 'segundo', 'tercero', 'cuarto', 'quinto', 'sexto']

export const allowedPlantel = (plantel: string) => Boolean(PLANTELES[plantel.toUpperCase()])

export const normalizePlantel = (input: unknown) => String(input || '').toUpperCase().trim()
export const normalizeGrade = (input: unknown) => String(input || '').toLowerCase().trim()
export const normalizeGroup = (input: unknown) => String(input || '').toUpperCase().trim()
