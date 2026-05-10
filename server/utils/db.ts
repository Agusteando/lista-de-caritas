import mysql, { type Pool, type PoolConnection } from 'mysql2/promise'
import { ensureDatabaseSchema } from './schema'

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

// App-owned attendance, Logros, and internal tables use the attendance database.
export function useDbPool() {
  return useAttendanceDbPool()
}

export async function withTransaction<T>(fn: (connection: PoolConnection) => Promise<T>) {
  const pool = useAttendanceDbPool()
  await ensureDatabaseSchema(pool)
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
