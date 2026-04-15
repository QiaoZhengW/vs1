CREATE DATABASE IF NOT EXISTS medical_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE medical_platform;

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'doctor') NOT NULL DEFAULT 'doctor',
  full_name VARCHAR(100) NOT NULL,
  department VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS medical_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_name VARCHAR(100) NOT NULL,
  patient_id VARCHAR(50) NOT NULL,
  study_date DATE NOT NULL,
  modality VARCHAR(50) NOT NULL,
  description VARCHAR(255) DEFAULT '',
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO users (username, password, role, full_name, department)
SELECT 'admin', 'admin123', 'admin', '系统管理员', '信息中心'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

INSERT INTO users (username, password, role, full_name, department)
SELECT 'doctor', 'doctor123', 'doctor', '演示医生', '影像科'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'doctor');
