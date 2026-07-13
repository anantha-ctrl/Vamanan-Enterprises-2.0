<?php
// api/config/migrate.php

function runMigrations($db) {
    if (!$db) return;

    // Users Table
    $migrations_users = [
        "ALTER TABLE users ADD COLUMN phone VARCHAR(20) AFTER email",
        "ALTER TABLE users ADD COLUMN kyc_status ENUM('none', 'pending', 'approved', 'rejected', 'verified') DEFAULT 'none' AFTER role",
        "ALTER TABLE users ADD COLUMN kyc_document VARCHAR(255) AFTER kyc_status",
        "ALTER TABLE users ADD COLUMN status ENUM('active', 'pending', 'suspended') DEFAULT 'pending' AFTER role",
        "ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER password",
        "ALTER TABLE users ADD COLUMN bank_name VARCHAR(100) AFTER kyc_document",
        "ALTER TABLE users ADD COLUMN account_no VARCHAR(50) AFTER bank_name",
        "ALTER TABLE users ADD COLUMN ifsc_code VARCHAR(20) AFTER account_no",
        "ALTER TABLE users ADD COLUMN branch_name VARCHAR(100) AFTER ifsc_code",
        // Admin switch to stop/resume a member's referral commissions (1 = earns, 0 = stopped).
        "ALTER TABLE users ADD COLUMN referral_active TINYINT(1) NOT NULL DEFAULT 1 AFTER referral_code",
        "ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'manager', 'staff', 'advocate', 'customer') DEFAULT 'customer'"
    ];

    // Cashback Cycles Table
    $migrations_cycles = [
        "CREATE TABLE IF NOT EXISTS cashback_cycles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            asset_type ENUM('gold', 'silver') NOT NULL,
            weight DECIMAL(10, 3) NOT NULL,
            total_value DECIMAL(15, 2) NOT NULL,
            daily_payout DECIMAL(15, 2) NOT NULL,
            status ENUM('pending', 'active', 'completed', 'cancelled') DEFAULT 'pending',
            transaction_id VARCHAR(255),
            payment_screenshot VARCHAR(255),
            last_paid_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",
        "ALTER TABLE cashback_cycles ADD COLUMN asset_type ENUM('gold', 'silver') DEFAULT 'gold' AFTER user_id",
        "ALTER TABLE cashback_cycles ADD COLUMN weight DECIMAL(10, 3) DEFAULT 0 AFTER asset_type",
        "ALTER TABLE cashback_cycles ADD COLUMN transaction_id VARCHAR(255)",
        "ALTER TABLE cashback_cycles ADD COLUMN payment_method VARCHAR(50) DEFAULT 'Bank Transfer'",
        "ALTER TABLE cashback_cycles ADD COLUMN payment_screenshot VARCHAR(255)",
        "ALTER TABLE cashback_cycles ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    ];

    // Transactions Table
    $migrations_transactions = [
        "ALTER TABLE transactions ADD COLUMN category VARCHAR(50) AFTER amount",
        "ALTER TABLE transactions ADD COLUMN status VARCHAR(20) DEFAULT 'pending' AFTER category",
        "ALTER TABLE transactions ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER description"
    ];

    // Products Table
    $migrations_products = [
        "CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            category VARCHAR(100) DEFAULT 'Gold',
            slug VARCHAR(255) UNIQUE NOT NULL,
            weight DECIMAL(8,3) DEFAULT 0,
            purity VARCHAR(100) DEFAULT '24K',
            price DECIMAL(15,2) NOT NULL DEFAULT 0,
            image VARCHAR(255),
            description TEXT,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )",
        "ALTER TABLE products ADD COLUMN category VARCHAR(100) DEFAULT 'Gold' AFTER name",
        "ALTER TABLE products ADD COLUMN weight DECIMAL(8,3) DEFAULT 0 AFTER slug",
        "ALTER TABLE products ADD COLUMN purity VARCHAR(100) DEFAULT '24K' AFTER weight",
        "ALTER TABLE products ADD COLUMN image VARCHAR(255) AFTER price",
        "ALTER TABLE products ADD COLUMN is_active TINYINT(1) DEFAULT 1 AFTER description",
        // Categories Table
        "CREATE TABLE IF NOT EXISTS categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",
        "INSERT IGNORE INTO categories (name, slug) VALUES
            ('Gold', 'gold'),
            ('House Construction', 'house-construction'),
            ('All Construction Material', 'all-construction-material'),
            ('Electronics', 'electronics'),
            ('Vehicles (2wheeler/4wheeler)', 'vehicles-2wheeler-4wheeler'),
            ('Groceries', 'groceries')",
        // Fix cashback_cycles to support product purchases
        "ALTER TABLE cashback_cycles ADD COLUMN asset_type ENUM('gold','silver','product') DEFAULT 'gold' AFTER user_id",
        "ALTER TABLE cashback_cycles MODIFY COLUMN asset_type ENUM('gold','silver','product') DEFAULT 'gold'",
        "ALTER TABLE cashback_cycles ADD COLUMN product_id INT DEFAULT NULL AFTER weight",
        "ALTER TABLE cashback_cycles ADD COLUMN product_name VARCHAR(255) DEFAULT NULL AFTER product_id",
        "ALTER TABLE cashback_cycles ADD COLUMN payment_method VARCHAR(50) DEFAULT 'Bank Transfer' AFTER transaction_id"
    ];

    // Platform Settings Table
    $migrations_settings = [
        "CREATE TABLE IF NOT EXISTS platform_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            config_key VARCHAR(100) UNIQUE NOT NULL,
            config_value TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )",
        "INSERT IGNORE INTO platform_settings (config_key, config_value) VALUES 
            ('referral_commission_l1', '5'),
            ('referral_commission_l2', '3'),
            ('referral_commission_l3', '2'),
            ('referral_commission_l4', '1'),
            ('referral_commission_l5', '0.5'),
            ('gold_base_price', '6500'),
            ('silver_base_price', '85'),
            ('min_withdrawal', '500'),
            ('min_investment', '5000')"
    ];

    // Withdrawals Table
    $migrations_withdrawals = [
        "CREATE TABLE IF NOT EXISTS withdrawals (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            amount DECIMAL(15, 2) NOT NULL,
            method VARCHAR(50),
            account_details TEXT,
            status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )"
    ];

    // Legal & Compliance Tables (Advocate Panel)
    $migrations_legal = [
        "CREATE TABLE IF NOT EXISTS agreements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            agreement_id VARCHAR(50) UNIQUE,
            product_id INT,
            agreement_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            type VARCHAR(100) DEFAULT 'Investment Deed',
            content LONGTEXT,
            status ENUM('pending', 'verified', 'rejected', 'legal_review') DEFAULT 'pending',
            signed_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",
        "ALTER TABLE agreements ADD COLUMN agreement_date DATETIME DEFAULT CURRENT_TIMESTAMP AFTER product_id",
        "CREATE TABLE IF NOT EXISTS disputes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            dispute_id VARCHAR(50) UNIQUE,
            subject VARCHAR(255),
            description TEXT,
            priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
            status ENUM('open', 'in_resolution', 'resolved', 'closed') DEFAULT 'open',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",
        "CREATE TABLE IF NOT EXISTS compliance_audit (
            id INT AUTO_INCREMENT PRIMARY KEY,
            admin_id INT NOT NULL,
            target_user_id INT,
            audit_type VARCHAR(100),
            details TEXT,
            status VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )"
    ];

    // Activity Logs Table
    $migrations_logs = [
        "CREATE TABLE IF NOT EXISTS activity_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            action VARCHAR(255) NOT NULL,
            details TEXT,
            ip_address VARCHAR(45),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )"
    ];

    $migrations_users = array_merge($migrations_users, [
        "ALTER TABLE users ADD COLUMN notify_email TINYINT(1) DEFAULT 1",
        "ALTER TABLE users ADD COLUMN notify_system TINYINT(1) DEFAULT 1",
        "ALTER TABLE users ADD COLUMN permissions TEXT"
    ]);

    $all_migrations = array_merge(
        $migrations_users, 
        $migrations_cycles, 
        $migrations_transactions, 
        $migrations_products, 
        $migrations_settings,
        $migrations_withdrawals,
        $migrations_legal,
        $migrations_logs
    );

    foreach ($all_migrations as $sql) {
        try {
            $db->exec($sql);
        } catch (Exception $e) {
            // Ignore errors (usually means column already exists)
        }
    }
}
?>
