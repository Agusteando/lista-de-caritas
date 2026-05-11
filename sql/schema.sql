-- Manual Logros table setup for lista-de-caritas app.
-- Run this on the ATTENDANCE_MYSQL_* database before enabling Logros.
-- The app does not create, alter, repair, or backfill tables at runtime.
-- The existing legacy `asistencia` table is required and is never created, altered, or repaired by this app.
-- Attendance reads and writes use that existing table directly.

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
