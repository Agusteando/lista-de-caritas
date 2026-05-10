import { createError } from 'h3'
import { hashString } from './hash'
import { useMatriculaDbPool } from './db'
import { PLANTELES, normalizeGrade, normalizeGroup, normalizePlantel } from './constants'

const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwyeMWN_OSv1Mvf4ikQsJAxvbSyEkYiX7Xr_OAkpkgdEf0PYM4fCBTt9_EiObN8eM45Hw/exec'
const MATRICULA_PHOTO_HOST = 'https://casitaiedis.edu.mx'
const SHEETS = new Set(['PM', 'PT', 'SM', 'ST', 'PREEM', 'PREET'])
const LEGACY_PAYLOAD_TTL_MS = 45_000
let cachedLegacyPayload: { data: Record<string, LegacyRow[]>; expiresAt: number } | null = null

interface LegacyRow {
  [key: string]: unknown
}

export interface LegacyStudent {
  id: string
  matricula: string | null
  nombre: string
  grado: string
  grupo: string
  plantel: string
  foto: string | null
  updatedAt: string | null
  groupCode?: string | null
  turn?: string | null
  source?: string | null
}

export interface LegacyGroupMeta {
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

const stripDiacritics = (value: unknown) =>
  typeof value === 'string' ? value.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : ''

const normKey = (value: unknown) => stripDiacritics(value).toLowerCase().trim()

const pick = (row: LegacyRow, candidates: string[]) => {
  const keys = Object.keys(row || {})
  for (const wanted of candidates) {
    const wantedNorm = normKey(wanted)
    for (const key of keys) if (normKey(key) === wantedNorm) return row[key]
  }
  for (const wanted of candidates) {
    const wantedNorm = normKey(wanted)
    for (const key of keys) {
      const keyNorm = normKey(key)
      if (keyNorm.includes(wantedNorm) || wantedNorm.includes(keyNorm)) return row[key]
    }
  }
  return undefined
}


function resolveExternalPhotoUrl(value: unknown) {
  const raw = String(value || '').trim()
  if (!raw) return null
  if (/^https?:\/\//i.test(raw)) return raw
  if (!/\.(?:apng|avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i.test(raw)) return null
  if (raw.startsWith('/virtual/')) return `${MATRICULA_PHOTO_HOST}${raw}`
  if (raw.startsWith('virtual/')) return `${MATRICULA_PHOTO_HOST}/${raw}`
  if (raw.startsWith('/')) return `${MATRICULA_PHOTO_HOST}${raw}`
  return `${MATRICULA_PHOTO_HOST}/virtual/${raw}`
}

const isBajaValue = (value: unknown) => {
  if (value === null || value === undefined) return false
  const text = String(value).toLowerCase().trim()
  if (!text) return false
  return text === '1' || text === 'true' || text === 'si' || text === 'sí' || text === 'baja' || text.startsWith('baja')
}

const COLS = {
  matricula: ['Matrícula', 'Matricula', 'MATRICULA'],
  grado: ['Grado'],
  grupo: ['Grupo'],
  nombres: ['Nombres', 'Nombre'],
  apPat: ['Apellido Paterno', 'Ap. Paterno', 'ApellidoPaterno'],
  apMat: ['Apellido Materno', 'Ap. Materno', 'ApellidoMaterno'],
  baja: ['Baja'],
  groupCode: ['Clave Grupo', 'Clave del Grupo', 'Código Grupo', 'Codigo Grupo', 'Código', 'Codigo', 'Clave', 'ID Grupo', 'Grupo ID'],
  turn: ['Turno', 'Horario', 'Jornada'],
  source: ['Plantel Nombre', 'Campus', 'Sede', 'Sección', 'Seccion']
}

async function fetchLegacyPayload() {
  const now = Date.now()
  if (cachedLegacyPayload && cachedLegacyPayload.expiresAt > now) return cachedLegacyPayload.data

  const response = await fetch(GOOGLE_APPS_SCRIPT_URL)
  if (!response.ok) throw createError({ statusCode: 502, statusMessage: 'No disponible' })
  const data = await response.json() as Record<string, LegacyRow[]>
  cachedLegacyPayload = { data, expiresAt: now + LEGACY_PAYLOAD_TTL_MS }
  return data
}

export const assertLegacyPlantel = (input: unknown) => {
  const plantel = normalizePlantel(input)
  if (!SHEETS.has(plantel)) throw createError({ statusCode: 400, statusMessage: 'Plantel no válido' })
  return plantel
}

function gradeToken(value: string) {
  const map: Record<string, string> = { primero: '1', segundo: '2', tercero: '3', cuarto: '4', quinto: '5', sexto: '6' }
  return map[value.toLowerCase()] || value.replace(/[^A-Z0-9]/gi, '').slice(0, 4).toUpperCase() || 'G'
}

function dataDerivedGroupCode(plantel: string, grado: string, grupo: string) {
  const cleanGroup = grupo.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9]+/gi, '').toUpperCase()
  return [plantel, gradeToken(grado), cleanGroup || 'GRUPO'].join('-')
}

function toLegacyStudent(row: LegacyRow, plantel: string): Omit<LegacyStudent, 'foto'> | null {
  const matricula = String(pick(row, COLS.matricula) ?? '').trim()
  const grado = normalizeGrade(pick(row, COLS.grado))
  const grupo = normalizeGroup(pick(row, COLS.grupo))
  const nombres = pick(row, COLS.nombres)
  const apPat = pick(row, COLS.apPat)
  const apMat = pick(row, COLS.apMat)
  const baja = pick(row, COLS.baja)
  const explicitGroupCode = String(pick(row, COLS.groupCode) ?? '').trim()
  const turn = String(pick(row, COLS.turn) ?? '').trim()
  const source = String(pick(row, COLS.source) ?? '').trim()

  if (!grupo) return null
  if (isBajaValue(baja)) return null

  const nombre = [apPat, apMat, nombres]
    .filter((value) => value !== null && value !== undefined && String(value).trim() !== '')
    .map((value) => String(value).trim())
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!nombre) return null

  const baseId = matricula || hashString(`${plantel}:${grado}:${grupo}:${nombre}`).slice(0, 24)

  return {
    id: `${plantel}-${baseId}`,
    matricula: matricula || null,
    nombre,
    grado,
    grupo,
    plantel,
    updatedAt: null,
    groupCode: explicitGroupCode || dataDerivedGroupCode(plantel, grado, grupo),
    turn: turn || null,
    source: source || null
  }
}

async function getFotoMap(matriculas: string[]) {
  if (!matriculas.length) return new Map<string, string | null>()
  try {
    const placeholders = matriculas.map(() => '?').join(',')
    const [rows] = await useMatriculaDbPool().query(
      `SELECT matricula, foto FROM matricula WHERE matricula IN (${placeholders})`,
      matriculas
    ) as unknown as [Array<{ matricula: string; foto: string | null }>, unknown]

    return new Map(rows.map((row) => [String(row.matricula).trim(), resolveExternalPhotoUrl(row.foto)]))
  } catch (err) {
    console.error('foto lookup skipped', err)
    return new Map<string, string | null>()
  }
}

export async function loadLegacyPlantelStudents(plantelInput: unknown, options: { includePhotos?: boolean } = {}) {
  const plantel = assertLegacyPlantel(plantelInput)
  const data = await fetchLegacyPayload()
  const rows = Array.isArray(data?.[plantel]) ? data[plantel] : []

  const studentsWithoutPhotos = rows
    .map((row) => toLegacyStudent(row, plantel))
    .filter((student): student is Omit<LegacyStudent, 'foto'> => Boolean(student))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))

  let fotoMap = new Map<string, string | null>()
  if (options.includePhotos) {
    const matriculas = studentsWithoutPhotos.map((student) => student.matricula).filter((value): value is string => Boolean(value))
    fotoMap = await getFotoMap(matriculas)
  }

  return studentsWithoutPhotos.map((student) => ({
    ...student,
    foto: student.matricula ? fotoMap.get(student.matricula) ?? null : null
  }))
}

export function buildGroupMeta(plantel: string, grado: string, grupo: string, students: Array<Pick<LegacyStudent, 'plantel' | 'grado' | 'grupo' | 'matricula' | 'foto' | 'groupCode' | 'turn' | 'source'>>) {
  const scoped = students.filter((student) => student.plantel === plantel && student.grado === grado && student.grupo === grupo)
  const first = scoped[0]
  const rosterVersion = `${scoped.length}:${plantel}:${grado}:${grupo}`
  return {
    plantel,
    grado,
    grupo,
    code: first?.groupCode || dataDerivedGroupCode(plantel, grado, grupo),
    turn: first?.turn || null,
    source: first?.source || null,
    rosterVersion,
    rosterCount: scoped.length,
    photoCount: scoped.filter((student) => Boolean(student.foto)).length
  } satisfies LegacyGroupMeta
}

export function buildPlantelMeta(plantel: string, students: Array<Pick<LegacyStudent, 'plantel' | 'grado' | 'grupo' | 'matricula' | 'foto' | 'groupCode' | 'turn' | 'source'>>) {
  const gradeOrder = ['primero', 'segundo', 'tercero', 'cuarto', 'quinto', 'sexto']
  const gruposByGrado: Record<string, string[]> = {}
  const rosterVersions: Record<string, string> = {}
  const groupMetaByKey: Record<string, LegacyGroupMeta> = {}

  for (const student of students) {
    if (!student.grado || !student.grupo) continue
    gruposByGrado[student.grado] ||= []
    if (!gruposByGrado[student.grado].includes(student.grupo)) gruposByGrado[student.grado].push(student.grupo)
    const key = `${student.grado}:${student.grupo}`
    const current = Number(rosterVersions[key] || 0)
    rosterVersions[key] = String(current + 1)
  }

  const grados = Object.keys(gruposByGrado).sort((a, b) => {
    const ai = gradeOrder.indexOf(a.toLowerCase())
    const bi = gradeOrder.indexOf(b.toLowerCase())
    if (ai === -1 && bi === -1) return a.localeCompare(b, 'es', { sensitivity: 'base' })
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })

  for (const grado of grados) {
    gruposByGrado[grado].sort((a, b) => a.localeCompare(b, 'es', { numeric: true, sensitivity: 'base' }))
    for (const grupo of gruposByGrado[grado]) {
      const key = `${grado}:${grupo}`
      groupMetaByKey[key] = buildGroupMeta(plantel, grado, grupo, students)
    }
  }

  return {
    plantel,
    title: PLANTELES[plantel] || plantel,
    grados,
    gruposByGrado,
    rosterVersions,
    groupMetaByKey
  }
}
