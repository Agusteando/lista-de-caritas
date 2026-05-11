import mysql, { type Pool, type PoolConnection } from 'mysql2/promise'

type PoolRole = 'attendance' | 'matricula'

let attendancePool: Pool | null = null
let matriculaPool: Pool | null = null

function poolConfig(role: PoolRole) {
  const config = useRuntimeConfig()
  const source = role === 'attendance' ? config.attendanceMysql : config.matriculaMysql

  return {
    host: String(source.host || '127.0.0.1'),
    port: Number(source.port || 3306),
    user: String(source.user || ''),
    password: String(source.password || ''),
    database: String(source.database || ''),
    waitForConnections: true,
    connectionLimit: role === 'attendance' ? 10 : 6,
    maxIdle: role === 'attendance' ? 10 : 6,
    idleTimeout: 60000,
    enableKeepAlive: true,
    namedPlaceholders: true,
    timezone: 'Z',
    dateStrings: true,
    charset: 'utf8mb4_unicode_ci'
  }
}

function createRolePool(role: PoolRole) {
  return mysql.createPool(poolConfig(role))
}

export function useAttendanceDbPool() {
  if (attendancePool) return attendancePool
  attendancePool = createRolePool('attendance')
  return attendancePool
}

export function useMatriculaDbPool() {
  if (matriculaPool) return matriculaPool
  matriculaPool = createRolePool('matricula')
  return matriculaPool
}

export function useDbPool() {
  return useAttendanceDbPool()
}

async function runTransaction<T>(pool: Pool, fn: (connection: PoolConnection) => Promise<T>) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const result = await fn(connection)
    await connection.commit()
    return result
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }
}

export async function withTransaction<T>(fn: (connection: PoolConnection) => Promise<T>) {
  return runTransaction(useAttendanceDbPool(), fn)
}

export async function withLogrosTransaction<T>(fn: (connection: PoolConnection) => Promise<T>) {
  return runTransaction(useAttendanceDbPool(), fn)
}
