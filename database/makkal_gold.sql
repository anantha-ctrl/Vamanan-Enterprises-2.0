
-- 1. Users Table (Plain Text Password Storage)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Storing as plain text
    role ENUM('admin', 'manager', 'staff', 'advocate', 'customer') DEFAULT 'customer',
    referral_code VARCHAR(50) UNIQUE,
    referrer_id INT NULL,
    phone VARCHAR(20),
    kyc_status ENUM('none', 'pending', 'verified', 'rejected') DEFAULT 'none',
    status ENUM('active', 'pending', 'suspended') DEFAULT 'pending',
    notify_email TINYINT(1) DEFAULT 1,
    notify_system TINYINT(1) DEFAULT 1,
    permissions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Wallets Table
CREATE TABLE IF NOT EXISTS wallets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Transactions Table (Ledger)
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_id INT NOT NULL,
    type ENUM('credit', 'debit') NOT NULL,
    category ENUM('cashback', 'referral', 'withdrawal', 'purchase') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
);

-- 4. Cashback Cycles Table
CREATE TABLE IF NOT EXISTS cashback_cycles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_value DECIMAL(15, 2) NOT NULL,
    daily_payout DECIMAL(15, 2) NOT NULL,
    paid_amount DECIMAL(15, 2) DEFAULT 0.00,
    days_paid INT DEFAULT 0,
    status ENUM('active', 'paused', 'completed') DEFAULT 'active',
    last_paid_at DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- SEED DATA (Default Credentials in PLAIN TEXT)
INSERT INTO users (name, email, password, role, referral_code) VALUES 
('System Admin', 'admin@makkalgold.com', 'password', 'admin', 'ADM001'),
('Branch Manager', 'manager@makkalgold.com', 'password', 'manager', 'MGR001'),
('Support Staff', 'staff@makkalgold.com', 'password', 'staff', 'STF001'),
('John Customer', 'user@makkalgold.com', 'password', 'customer', 'USR001');

UPDATE users SET status = 'active' WHERE role IN ('admin', 'manager', 'staff', 'advocate');

-- Initialize Wallets for seeded users
INSERT INTO wallets (user_id, balance) 
SELECT id, 10000.00 FROM users;
