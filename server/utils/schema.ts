import type { Pool } from 'mysql2/promise'

let logrosSchemaPromise: Promise<void> | null = null

const logrosTablesSql = [
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci`
]

const requiredColumns: Record<string, Record<string, string>> = {
  logro_operations: {
    payload_hash: "ALTER TABLE logro_operations ADD COLUMN payload_hash CHAR(64) NOT NULL DEFAULT '' AFTER status",
    result_json: 'ALTER TABLE logro_operations ADD COLUMN result_json JSON NULL AFTER payload_hash'
  },
  logro_events: {
    featured: 'ALTER TABLE logro_events ADD COLUMN featured TINYINT(1) NOT NULL DEFAULT 0 AFTER points',
    streak_bonus: 'ALTER TABLE logro_events ADD COLUMN streak_bonus INT NOT NULL DEFAULT 0 AFTER featured',
    weekly_milestone_bonus: 'ALTER TABLE logro_events ADD COLUMN weekly_milestone_bonus INT NOT NULL DEFAULT 0 AFTER streak_bonus',
    awarded_at: 'ALTER TABLE logro_events ADD COLUMN awarded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER weekly_milestone_bonus'
  }
}

const indexSql = [
  'CREATE INDEX idx_logros_category ON logro_events (plantel, grado, grupo, category, awarded_at)',
  'CREATE INDEX idx_logros_student ON logro_events (student_id, awarded_at)'
]

async function columnExists(pool: Pool, tableName: string, columnName: string) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [tableName, columnName]
  ) as unknown as [Array<{ total: number | string }>, unknown]
  return Number(rows[0]?.total || 0) > 0
}

async function healLogrosColumns(pool: Pool) {
  for (const [tableName, columns] of Object.entries(requiredColumns)) {
    for (const [columnName, alterSql] of Object.entries(columns)) {
      if (!(await columnExists(pool, tableName, columnName))) await pool.query(alterSql)
    }
  }
}

async function healLogrosIndexes(pool: Pool) {
  for (const sql of indexSql) {
    try {
      await pool.query(sql)
    } catch (err) {
      const code = typeof err === 'object' && err && 'code' in err ? String((err as { code?: unknown }).code) : ''
      if (code !== 'ER_DUP_KEYNAME') throw err
    }
  }
}

export async function ensureLogrosSchema(pool: Pool) {
  if (!logrosSchemaPromise) {
    logrosSchemaPromise = (async () => {
      for (const sql of logrosTablesSql) await pool.query(sql)
      await healLogrosColumns(pool)
      await healLogrosIndexes(pool)
    })().catch((err) => {
      logrosSchemaPromise = null
      throw err
    })
  }
  await logrosSchemaPromise
}
