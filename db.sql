-- ملف: db.sql
-- قاعدة بيانات: HNU

CREATE DATABASE IF NOT EXISTS HNU CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE HNU;

-- جدول الحسابات
CREATE TABLE IF NOT EXISTS accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  opening_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  balance_type ENUM('debit','credit') NOT NULL DEFAULT 'debit',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- جدول القيود اليومية
CREATE TABLE IF NOT EXISTS entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entry_date DATE NOT NULL,
  debit_account_id INT NOT NULL,
  credit_account_id INT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description VARCHAR(500) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (debit_account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
  FOREIGN KEY (credit_account_id) REFERENCES accounts(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- بيانات اختبارية (اختياري)
INSERT INTO accounts (name, opening_balance, balance_type) VALUES
('الصندوق', 10000.00, 'debit'),
('البنك', 5000.00, 'debit'),
('رأس المال', 15000.00, 'credit');

INSERT INTO entries (entry_date, debit_account_id, credit_account_id, amount, description) VALUES
('2025-10-01', 1, 3, 1000.00, 'سحب من رأس المال للصندوق'),
('2025-10-05', 2, 1, 2000.00, 'تحويل من الصندوق للبنك');
