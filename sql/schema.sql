-- lista-de-caritas app writes its own attendance, Logros, idempotency, and internal logging tables.
-- Run this on the ATTENDANCE_MYSQL_* database. Runtime auto-healing lives in server/utils/schema.ts
-- and creates/repairs these tables on the attendance connection on server start and before DB-backed routes.
-- Roster data is read through server/utils/legacyRoster.ts, modeled on the supplied legacy endpoint.
-- Student photos are looked up from the existing legacy table `matricula(matricula, foto)` through MATRICULA_MYSQL_* when available.

CREATE TABLE IF NOT EXISTS attendance_operations (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attendance_records (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE IF NOT EXISTS logro_operations (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS logro_events (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE IF NOT EXISTS internal_logs (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
