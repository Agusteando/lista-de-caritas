import type { H3Event } from 'h3'
import { useDbPool } from './db'
import { ensureDatabaseSchema } from './schema'

interface LogInput {
  endpoint: string
  operationId?: string | null
  plantel?: string | null
  grado?: string | null
  grupo?: string | null
  payloadSummary?: unknown
  failureReason: string
  retryStatus?: string | null
}

export async function logTechnicalFailure(event: H3Event | null, input: LogInput) {
  const timestamp = new Date().toISOString()
  const record = {
    endpoint: input.endpoint,
    operationId: input.operationId || null,
    plantel: input.plantel || null,
    grado: input.grado || null,
    grupo: input.grupo || null,
    timestamp,
    payloadSummary: input.payloadSummary ? JSON.stringify(input.payloadSummary).slice(0, 4000) : null,
    failureReason: input.failureReason.slice(0, 4000),
    retryStatus: input.retryStatus || null,
    requestPath: event?.path || null
  }

  try {
    const pool = useDbPool()
    await ensureDatabaseSchema(pool)
    await pool.execute(
      `INSERT INTO internal_logs
        (endpoint, operation_id, plantel, grado, grupo, logged_at, payload_summary, failure_reason, retry_status, request_path)
       VALUES (:endpoint, :operationId, :plantel, :grado, :grupo, :timestamp, :payloadSummary, :failureReason, :retryStatus, :requestPath)`,
      record
    )
  } catch (err) {
    console.error('internal log write failed', { record, err })
  }
}
