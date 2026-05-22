<?php
// api/config.php
// Unified database configuration using PDO with self-healing schema initialization

// $host = "localhost";
// $db_name = "cwhycofr_makkal_gold";
// $username = "cwhycofr_admin";
// $password = "vamanan@gold123";
$host = "localhost";
$db_name = "makkal_gold";
$username = "root";
$password = "anantha";

try {
    $pdo = new PDO("mysql:host=$host", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Create database if not exists
    $pdo->exec("CREATE DATABASE IF NOT EXISTS $db_name");
    $pdo->exec("USE $db_name");

    // --- SELF-HEALING DATABASE INITIALIZATION ---

    // 1. Users Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'manager', 'staff', 'advocate', 'customer') DEFAULT 'customer',
        kyc_status ENUM('none', 'pending', 'verified', 'rejected') DEFAULT 'none',
        referral_code VARCHAR(50) UNIQUE,
        referrer_id INT DEFAULT NULL,
        phone VARCHAR(20),
        address TEXT,
        aadhar_no VARCHAR(20),
        pan_no VARCHAR(20),
        kyc_document VARCHAR(255),
        status ENUM('active', 'pending', 'suspended') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // Ensure all user columns exist (Safe Migrations)
    $columns = [
        'kyc_status' => "ENUM('none', 'pending', 'verified', 'rejected') DEFAULT 'none' AFTER role",
        'phone' => "VARCHAR(20) AFTER referrer_id",
        'address' => "TEXT AFTER phone",
        'aadhar_no' => "VARCHAR(20) AFTER address",
        'pan_no' => "VARCHAR(20) AFTER aadhar_no",
        'kyc_document' => "VARCHAR(255) AFTER pan_no",
        'avatar' => "VARCHAR(255) AFTER kyc_document",
        'bank_name' => "VARCHAR(255) AFTER avatar",
        'account_no' => "VARCHAR(50) AFTER bank_name",
        'ifsc_code' => "VARCHAR(20) AFTER account_no",
        'branch_name' => "VARCHAR(255) AFTER ifsc_code",
        'status' => "ENUM('active', 'pending', 'suspended') DEFAULT 'pending' AFTER branch_name",
        'notify_email' => "TINYINT(1) DEFAULT 1 AFTER status",
        'notify_system' => "TINYINT(1) DEFAULT 1 AFTER notify_email",
        'permissions' => "TEXT AFTER notify_system"
    ];

    foreach ($columns as $col => $definition) {
        try {
            $pdo->exec("ALTER TABLE users ADD COLUMN $col $definition");
        } catch (PDOException $e) {
            // Column probably exists
        }
    }

    try {
        $pdo->exec("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'manager', 'staff', 'advocate', 'customer') DEFAULT 'customer'");
    } catch (PDOException $e) {}

    // 2. Wallets Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS wallets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        balance DECIMAL(15,2) DEFAULT 0.00,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");

    // Ensure wallet columns exist
    $walletCols = [
        'total_earned' => "DECIMAL(15,2) DEFAULT 0.00 AFTER balance",
        'total_withdrawn' => "DECIMAL(15,2) DEFAULT 0.00 AFTER total_earned"
    ];
    foreach ($walletCols as $col => $definition) {
        try {
            $pdo->exec("ALTER TABLE wallets ADD COLUMN $col $definition");
        } catch (PDOException $e) {}
    }

    $pdo->exec("CREATE TABLE IF NOT EXISTS export_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255),
        export_type VARCHAR(50),
        total_amount DECIMAL(15,2),
        total_records INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // 4. Products Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        price DECIMAL(15,2) NOT NULL,
        weight VARCHAR(50) DEFAULT '1 Gram',
        purity VARCHAR(50) NOT NULL DEFAULT '24K',
        stock INT DEFAULT 0,
        image_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    // Ensure products columns exist (Safe Migrations)
    $prodCols = [
        'slug' => "VARCHAR(255) UNIQUE NOT NULL AFTER name",
        'purity' => "VARCHAR(50) NOT NULL DEFAULT '24K' AFTER weight"
    ];
    foreach ($prodCols as $col => $definition) {
        try {
            $pdo->exec("ALTER TABLE products ADD COLUMN $col $definition");
        } catch (PDOException $e) {}
    }

    // 4. Transactions Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        wallet_id INT NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        type ENUM('credit', 'debit') NOT NULL,
        category ENUM('purchase', 'referral', 'withdrawal', 'payout', 'cashback') NOT NULL,
        status ENUM('pending', 'completed', 'failed', 'rejected') DEFAULT 'pending',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
    )");

    // 5. Withdrawals Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS withdrawals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        payment_method VARCHAR(100),
        transaction_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");

    // 6. Cashback Cycles Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS cashback_cycles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        total_value DECIMAL(15,2) NOT NULL,
        daily_payout DECIMAL(15,2) NOT NULL,
        days_paid INT DEFAULT 0,
        paid_amount DECIMAL(15,2) DEFAULT 0.00,
        transaction_id VARCHAR(255),
        payment_screenshot VARCHAR(255),
        status ENUM('active', 'completed', 'paused', 'pending') DEFAULT 'pending',
        last_paid_at DATE DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");

    // Ensure columns exist (Safe Migrations)
    try { $pdo->exec("ALTER TABLE cashback_cycles ADD COLUMN transaction_id VARCHAR(255) AFTER paid_amount"); } catch (PDOException $e) {}
    try { $pdo->exec("ALTER TABLE cashback_cycles ADD COLUMN payment_screenshot VARCHAR(255) AFTER transaction_id"); } catch (PDOException $e) {}
    try { $pdo->exec("ALTER TABLE cashback_cycles ADD COLUMN last_paid_at DATE DEFAULT NULL AFTER status"); } catch (PDOException $e) {}
    try { $pdo->exec("ALTER TABLE cashback_cycles MODIFY COLUMN status ENUM('active', 'completed', 'paused', 'pending') DEFAULT 'pending'"); } catch (PDOException $e) {}
    
    // Add safe migrations for column renames if necessary
    try { $pdo->exec("ALTER TABLE cashback_cycles CHANGE days_completed days_paid INT DEFAULT 0"); } catch (PDOException $e) {}
    try { $pdo->exec("ALTER TABLE cashback_cycles CHANGE total_earned paid_amount DECIMAL(15,2) DEFAULT 0.00"); } catch (PDOException $e) {}

    // 7. Agreements Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS agreements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        agreement_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status ENUM('pending', 'signed', 'expired') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )");
    try { $pdo->exec("ALTER TABLE agreements ADD COLUMN agreement_date DATETIME DEFAULT CURRENT_TIMESTAMP AFTER product_id"); } catch (PDOException $e) {}

    // 8. Support Tickets Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS support_tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
        status ENUM('open', 'resolved', 'closed') DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");

    // 9. Password Resets
    $pdo->exec("CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp_hash VARCHAR(255) NOT NULL,
        attempts INT DEFAULT 0,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // 9b. Login OTP sessions (Fintech OTP login)
    $pdo->exec("CREATE TABLE IF NOT EXISTS login_otps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        otp_hash VARCHAR(255) NOT NULL,
        attempts INT DEFAULT 0,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // 10. Notifications Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('info', 'warning', 'success', 'payout') DEFAULT 'info',
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // Ensure attempts column exists
    try {
        $pdo->exec("ALTER TABLE password_resets ADD COLUMN attempts INT DEFAULT 0 AFTER otp_hash");
    } catch (PDOException $e) {}

    // --- SEED INITIAL DATA ---
    $count = $pdo->query("SELECT COUNT(*) FROM products")->fetchColumn();
    if ($count == 0) {
        $pdo->exec("INSERT INTO products (name, slug, description, price, weight, purity) VALUES 
            ('22K Gold Coin (1g)', '22k-gold-coin-1g', 'Pure 22K Gold Coin with BIS Hallmark.', 7850.00, '1 Gram', '22K'),
            ('22K Gold Coin (2g)', '22k-gold-coin-2g', 'Pure 22K Gold Coin with BIS Hallmark.', 15700.00, '2 Grams', '22K'),
            ('22K Gold Coin (5g)', '22k-gold-coin-5g', 'Pure 22K Gold Coin with BIS Hallmark.', 39250.00, '5 Grams', '22K')");
    }

    // Seed Admin if not exists
    $adminCount = $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'admin'")->fetchColumn();
    if ($adminCount == 0) {
        $adminPass = password_hash('admin123', PASSWORD_BCRYPT);
        $pdo->prepare("INSERT INTO users (name, email, password, role, referral_code, status) VALUES (?, ?, ?, ?, ?, ?)")
            ->execute(['Super Admin', 'admin@makkalgold.com', $adminPass, 'admin', 'ADMIN001', 'active']);
    }

    // Seed Manager if not exists
    $managerCount = $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'manager'")->fetchColumn();
    if ($managerCount == 0) {
        $managerPass = password_hash('manager123', PASSWORD_BCRYPT);
        $pdo->prepare("INSERT INTO users (name, email, password, role, referral_code, status) VALUES (?, ?, ?, ?, ?, ?)")
            ->execute(['Operations Manager', 'manager@makkalgold.com', $managerPass, 'manager', 'MGR001', 'active']);
    }

    // Ensure existing admins/managers are active
    $pdo->exec("UPDATE users SET status = 'active' WHERE role IN ('admin', 'manager')");

} catch (PDOException $e) {
    die(json_encode(["status" => "error", "message" => "Database Connection/Init failed: " . $e->getMessage()]));
}

// Global $pdo for backward compatibility if needed
$db = $pdo;
?>
