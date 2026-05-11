export type PlantelAccent = 'green' | 'gold' | 'blue' | 'rose' | 'violet'

export type PlantelOption = {
  code: string
  title: string
  level: 'Primaria' | 'Secundaria' | 'Preescolar'
  city: 'Metepec' | 'Toluca'
  accent: PlantelAccent
}

export const PLANTELES: PlantelOption[] = [
  { code: 'PM', title: 'Primaria Metepec', level: 'Primaria', city: 'Metepec', accent: 'green' },
  { code: 'PT', title: 'Primaria Toluca', level: 'Primaria', city: 'Toluca', accent: 'gold' },
  { code: 'SM', title: 'Secundaria Metepec', level: 'Secundaria', city: 'Metepec', accent: 'blue' },
  { code: 'ST', title: 'Secundaria Toluca', level: 'Secundaria', city: 'Toluca', accent: 'rose' },
  { code: 'PREEM', title: 'Preescolar Metepec', level: 'Preescolar', city: 'Metepec', accent: 'violet' },
  { code: 'PREET', title: 'Preescolar Toluca', level: 'Preescolar', city: 'Toluca', accent: 'green' }
]

export const getPlantelByCode = (code?: string) => PLANTELES.find((plantel) => plantel.code === code?.toUpperCase())
