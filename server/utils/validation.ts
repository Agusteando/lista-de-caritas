import { createError, getRouterParam } from 'h3'
import { allowedPlantel, normalizeGrade, normalizeGroup, normalizePlantel } from './constants'

export function routePlantel(event: Parameters<typeof getRouterParam>[0]) {
  const plantel = normalizePlantel(getRouterParam(event, 'plantel'))
  if (!allowedPlantel(plantel)) {
    throw createError({ statusCode: 400, statusMessage: 'Plantel no válido' })
  }
  return plantel
}

export function routeGroup(event: Parameters<typeof getRouterParam>[0]) {
  const plantel = routePlantel(event)
  const grado = normalizeGrade(getRouterParam(event, 'grado'))
  const grupo = normalizeGroup(getRouterParam(event, 'grupo'))
  if (!grado || !grupo) throw createError({ statusCode: 400, statusMessage: 'Grupo no válido' })
  return { plantel, grado, grupo }
}

export function assertStatus(input: unknown) {
  if (input === 'present' || input === 'absent' || input === 'sick' || input === 'unmarked') return input
  throw createError({ statusCode: 400, statusMessage: 'Estado no válido' })
}

export function legacyFromStatus(status: 'present' | 'absent' | 'sick' | 'unmarked') {
  if (status === 'present') return { modalidad: '1', attendance: 1 }
  if (status === 'sick') return { modalidad: '2', attendance: 0 }
  if (status === 'absent') return { modalidad: '0', attendance: 0 }
  return { modalidad: '9', attendance: 0 }
}
