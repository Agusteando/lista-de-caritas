import type { Pool } from 'mysql2/promise'

let schemaPromise: Promise<void> | null = null

const tablesSql = [
  `CREATE TABLE IF NOT EXISTS attendance_operations (
    operation_id VARCHAR(120) PRIMARY KEY,
    operation_type VARCHAR(60) NOT NULL,
    plantel VARCHAR(20) NOT NULL,
    grado VARCHAR(80) NOT NULL,
    grupo VARCHAR(40) NOT NULL,
    status ENUM('pending','success','discarded') NOT NULL DEFAULT 'pending',
    payload_hash CHAR(64) NOT NULL,
    result_json JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_attendance_operations_group (plantel, grado, grupo, created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS attendance_records (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    operation_id VARCHAR(120) NOT NULL,
    plantel VARCHAR(20) NOT NULL,
    grado VARCHAR(80) NOT NULL,
    grupo VARCHAR(40) NOT NULL,
    student_id VARCHAR(80) NOT NULL,
    nombre VARCHAR(220) NOT NULL,
    attendance_date DATE NOT NULL,
    status ENUM('present','absent','sick','unmarked') NOT NULL,
    modalidad ENUM('0','1','2','9') NOT NULL,
    attendance TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_attendance_student_day (plantel, grado, grupo, student_id, attendance_date),
    INDEX idx_attendance_records_operation (operation_id),
    INDEX idx_attendance_records_day_group (attendance_date, plantel, grado, grupo)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci`,
  `CREATE TABLE IF NOT EXISTS logro_operations (
    operation_id VARCHAR(120) PRIMARY KEY,
    plantel VARCHAR(20) NOT NULL,
    grado VARCHAR(80) NOT NULL,
    grupo VARCHAR(40) NOT NULL,
    status ENUM('pending','success','discarded') NOT NULL DEFAULT 'pending',
    payload_hash CHAR(64) NOT NULL,
    result_json JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_logro_operations_group (plantel, grado, grupo, created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS logro_events (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    operation_id VARCHAR(120) NOT NULL UNIQUE,
    student_id VARCHAR(80) NOT NULL,
    plantel VARCHAR(20) NOT NULL,
    grado VARCHAR(80) NOT NULL,
    grupo VARCHAR(40) NOT NULL,
    category ENUM('Participación','Esfuerzo','Ayuda a compañeros','Puntualidad','Buena actitud','Trabajo completo','Lectura','Liderazgo') NOT NULL,
    points INT NOT NULL DEFAULT 1,
    featured TINYINT(1) NOT NULL DEFAULT 0,
    streak_bonus INT NOT NULL DEFAULT 0,
    weekly_milestone_bonus INT NOT NULL DEFAULT 0,
    awarded_at DATETIME NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_logros_week (plantel, grado, grupo, awarded_at),
    INDEX idx_logros_student (student_id, awarded_at),
    INDEX idx_logros_category (plantel, grado, grupo, category, awarded_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci`,
  `CREATE TABLE IF NOT EXISTS internal_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    endpoint VARCHAR(220) NOT NULL,
    operation_id VARCHAR(120) NULL,
    plantel VARCHAR(20) NULL,
    grado VARCHAR(80) NULL,
    grupo VARCHAR(40) NULL,
    logged_at DATETIME NOT NULL,
    payload_summary TEXT NULL,
    failure_reason TEXT NOT NULL,
    retry_status VARCHAR(120) NULL,
    request_path VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_internal_logs_context (plantel, grado, grupo, logged_at),
    INDEX idx_internal_logs_operation (operation_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
]

const requiredColumns: Record<string, Record<string, string>> = {
  attendance_operations: {
    operation_type: "ALTER TABLE attendance_operations ADD COLUMN operation_type VARCHAR(60) NOT NULL DEFAULT 'attendance_save' AFTER operation_id",
    payload_hash: "ALTER TABLE attendance_operations ADD COLUMN payload_hash CHAR(64) NOT NULL DEFAULT '' AFTER status",
    result_json: 'ALTER TABLE attendance_operations ADD COLUMN result_json JSON NULL AFTER payload_hash'
  },
  attendance_records: {
    status: "ALTER TABLE attendance_records ADD COLUMN status ENUM('present','absent','sick','unmarked') NOT NULL DEFAULT 'unmarked' AFTER attendance_date",
    modalidad: "ALTER TABLE attendance_records ADD COLUMN modalidad ENUM('0','1','2','9') NOT NULL DEFAULT '9' AFTER status",
    attendance: 'ALTER TABLE attendance_records ADD COLUMN attendance TINYINT(1) NOT NULL DEFAULT 0 AFTER modalidad',
    updated_at: 'ALTER TABLE attendance_records ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at'
  },
  logro_operations: {
    payload_hash: "ALTER TABLE logro_operations ADD COLUMN payload_hash CHAR(64) NOT NULL DEFAULT '' AFTER status",
    result_json: 'ALTER TABLE logro_operations ADD COLUMN result_json JSON NULL AFTER payload_hash'
  },
  logro_events: {
    featured: 'ALTER TABLE logro_events ADD COLUMN featured TINYINT(1) NOT NULL DEFAULT 0 AFTER points',
    streak_bonus: 'ALTER TABLE logro_events ADD COLUMN streak_bonus INT NOT NULL DEFAULT 0 AFTER featured',
    weekly_milestone_bonus: 'ALTER TABLE logro_events ADD COLUMN weekly_milestone_bonus INT NOT NULL DEFAULT 0 AFTER streak_bonus',
    awarded_at: 'ALTER TABLE logro_events ADD COLUMN awarded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER weekly_milestone_bonus'
  },
  internal_logs: {
    request_path: 'ALTER TABLE internal_logs ADD COLUMN request_path VARCHAR(255) NULL AFTER retry_status'
  }
}

const indexSql = [
  'CREATE INDEX idx_logros_category ON logro_events (plantel, grado, grupo, category, awarded_at)',
  'CREATE INDEX idx_logros_student ON logro_events (student_id, awarded_at)',
  'CREATE INDEX idx_attendance_records_day_group ON attendance_records (attendance_date, plantel, grado, grupo)'
]

async function columnExists(pool: Pool, tableName: string, columnName: string) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [tableName, columnName]
  ) as unknown as [Array<{ total: number }>, unknown]
  return Number(rows[0]?.total || 0) > 0
}

async function healColumns(pool: Pool) {
  for (const [tableName, columns] of Object.entries(requiredColumns)) {
    for (const [columnName, alterSql] of Object.entries(columns)) {
      if (!(await columnExists(pool, tableName, columnName))) {
        await pool.query(alterSql)
      }
    }
  }
}

async function healIndexes(pool: Pool) {
  for (const sql of indexSql) {
    try {
      await pool.query(sql)
    } catch (err) {
      const code = typeof err === 'object' && err && 'code' in err ? String((err as { code?: unknown }).code) : ''
      if (code !== 'ER_DUP_KEYNAME') throw err
    }
  }
}

export async function ensureDatabaseSchema(pool: Pool) {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      for (const sql of tablesSql) await pool.query(sql)
      await healColumns(pool)
      await healIndexes(pool)
    })().catch((err) => {
      schemaPromise = null
      throw err
    })
  }
  await schemaPromise
}
