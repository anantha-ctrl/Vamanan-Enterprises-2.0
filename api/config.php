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
        'permissions' => "TEXT AFTER notify_system",
        // Admin switch: 1 = member earns referral commission, 0 = referral stopped.
        'referral_active' => "TINYINT(1) NOT NULL DEFAULT 1 AFTER referral_code"
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
        category VARCHAR(100) DEFAULT 'Gold',
        slug VARCHAR(255) UNIQUE NOT NULL,
        weight DECIMAL(8,3) DEFAULT 0,
        purity VARCHAR(100) DEFAULT '24K',
        price DECIMAL(15,2) NOT NULL,
        image VARCHAR(255),
        description TEXT,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    // Safe migrations for products — add any missing columns
    $prodCols = [
        'category'    => "VARCHAR(100) DEFAULT 'Gold' AFTER name",
        'weight'      => "DECIMAL(8,3) DEFAULT 0 AFTER slug",
        'purity'      => "VARCHAR(100) DEFAULT '24K' AFTER weight",
        'image'       => "VARCHAR(255) AFTER price",
        'is_active'   => "TINYINT(1) DEFAULT 1 AFTER description",
    ];
    foreach ($prodCols as $col => $definition) {
        try { $pdo->exec("ALTER TABLE products ADD COLUMN $col $definition"); } catch (PDOException $e) {}
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
    // Ensure the category enum covers every category the app writes (esp. 'cashback' —
    // a stale migration elsewhere had dropped it, breaking the cashback ledger).
    try { $pdo->exec("ALTER TABLE transactions MODIFY COLUMN category ENUM('purchase', 'purchase_request', 'referral', 'cashback', 'payout', 'withdrawal', 'liquidation', 'manual', 'deposit', 'other') NOT NULL DEFAULT 'other'"); } catch (PDOException $e) {}
    // TDS & charges breakdown on incentive credits (cashback / referral):
    //   amount         = NET credited to the wallet (post-deduction)
    //   gross_amount   = pre-deduction incentive (e.g. 1% daily cashback)
    //   tds_amount     = TDS component withheld
    //   charges_amount = processing/service charge component withheld
    //   deduction      = total deduction (tds_amount + charges_amount = gross - net)
    // NULL on rows where no deduction applies (purchases, withdrawals, legacy rows).
    try { $pdo->exec("ALTER TABLE transactions ADD COLUMN gross_amount DECIMAL(15,2) NULL AFTER amount"); } catch (PDOException $e) {}
    try { $pdo->exec("ALTER TABLE transactions ADD COLUMN tds_amount DECIMAL(15,2) NULL AFTER gross_amount"); } catch (PDOException $e) {}
    try { $pdo->exec("ALTER TABLE transactions ADD COLUMN charges_amount DECIMAL(15,2) NULL AFTER tds_amount"); } catch (PDOException $e) {}
    try { $pdo->exec("ALTER TABLE transactions ADD COLUMN deduction DECIMAL(15,2) NULL AFTER charges_amount"); } catch (PDOException $e) {}

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
        asset_type ENUM('gold','silver','product') DEFAULT 'gold',
        weight DECIMAL(10,3) DEFAULT 0,
        product_id INT DEFAULT NULL,
        product_name VARCHAR(255) DEFAULT NULL,
        total_value DECIMAL(15,2) NOT NULL,
        daily_payout DECIMAL(15,2) NOT NULL,
        days_paid INT DEFAULT 0,
        paid_amount DECIMAL(15,2) DEFAULT 0.00,
        transaction_id VARCHAR(255),
        payment_method VARCHAR(50) DEFAULT 'Bank Transfer',
        payment_screenshot VARCHAR(255),
        status ENUM('active','completed','paused','pending') DEFAULT 'pending',
        last_paid_at DATE DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");

    // Safe migrations for cashback_cycles
    try { $pdo->exec("ALTER TABLE cashback_cycles ADD COLUMN asset_type ENUM('gold','silver','product') DEFAULT 'gold' AFTER user_id"); } catch (PDOException $e) {}
    try { $pdo->exec("ALTER TABLE cashback_cycles MODIFY COLUMN asset_type ENUM('gold','silver','product') DEFAULT 'gold'"); } catch (PDOException $e) {}
    try { $pdo->exec("ALTER TABLE cashback_cycles ADD COLUMN weight DECIMAL(10,3) DEFAULT 0 AFTER asset_type"); } catch (PDOException $e) {}
    try { $pdo->exec("ALTER TABLE cashback_cycles ADD COLUMN product_id INT DEFAULT NULL AFTER weight"); } catch (PDOException $e) {}
    try { $pdo->exec("ALTER TABLE cashback_cycles ADD COLUMN product_name VARCHAR(255) DEFAULT NULL AFTER product_id"); } catch (PDOException $e) {}
    try { $pdo->exec("ALTER TABLE cashback_cycles ADD COLUMN transaction_id VARCHAR(255) AFTER paid_amount"); } catch (PDOException $e) {}
    try { $pdo->exec("ALTER TABLE cashback_cycles ADD COLUMN payment_method VARCHAR(50) DEFAULT 'Bank Transfer' AFTER transaction_id"); } catch (PDOException $e) {}
    try { $pdo->exec("ALTER TABLE cashback_cycles ADD COLUMN payment_screenshot VARCHAR(255) AFTER payment_method"); } catch (PDOException $e) {}
    try { $pdo->exec("ALTER TABLE cashback_cycles ADD COLUMN last_paid_at DATE DEFAULT NULL AFTER status"); } catch (PDOException $e) {}
    try { $pdo->exec("ALTER TABLE cashback_cycles MODIFY COLUMN status ENUM('active','completed','paused','pending','rejected','cancelled') DEFAULT 'pending'"); } catch (PDOException $e) {}
    try { $pdo->exec("ALTER TABLE cashback_cycles CHANGE days_completed days_paid INT DEFAULT 0"); } catch (PDOException $e) {}
    try { $pdo->exec("ALTER TABLE cashback_cycles CHANGE total_earned paid_amount DECIMAL(15,2) DEFAULT 0.00"); } catch (PDOException $e) {}

    // GST-exclusive cashback columns.
    //  - product_amount            : subtotal of products BEFORE GST
    //  - gst_amount                : GST charged on top
    //  - total_amount              : what the customer actually pays (product_amount + gst_amount = total_value)
    //  - cashback_eligible_amount  : the ONLY base used for cashback/referral/commission (== product_amount, GST excluded)
    try { $pdo->exec("ALTER TABLE cashback_cycles ADD COLUMN product_amount DECIMAL(15,2) DEFAULT 0.00 AFTER product_name"); } catch (PDOException $e) {}
    try { $pdo->exec("ALTER TABLE cashback_cycles ADD COLUMN gst_amount DECIMAL(15,2) DEFAULT 0.00 AFTER product_amount"); } catch (PDOException $e) {}
    try { $pdo->exec("ALTER TABLE cashback_cycles ADD COLUMN total_amount DECIMAL(15,2) DEFAULT 0.00 AFTER gst_amount"); } catch (PDOException $e) {}
    try { $pdo->exec("ALTER TABLE cashback_cycles ADD COLUMN cashback_eligible_amount DECIMAL(15,2) DEFAULT 0.00 AFTER total_amount"); } catch (PDOException $e) {}
    // Backfill legacy rows (created before GST split — GST was 0, so product == total).
    try { $pdo->exec("UPDATE cashback_cycles SET product_amount = total_value WHERE (product_amount IS NULL OR product_amount = 0) AND total_value > 0"); } catch (PDOException $e) {}
    try { $pdo->exec("UPDATE cashback_cycles SET total_amount = total_value WHERE (total_amount IS NULL OR total_amount = 0) AND total_value > 0"); } catch (PDOException $e) {}
    try { $pdo->exec("UPDATE cashback_cycles SET cashback_eligible_amount = product_amount WHERE (cashback_eligible_amount IS NULL OR cashback_eligible_amount = 0) AND product_amount > 0"); } catch (PDOException $e) {}
    // Link each cycle to its originating ledger transaction (for exact approve/reject/delete).
    try { $pdo->exec("ALTER TABLE cashback_cycles ADD COLUMN ledger_txn_id INT NULL"); } catch (PDOException $e) {}

    // 11. Categories Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    // Seed product categories used by admin inventory and customer shop.
    $pdo->exec("INSERT IGNORE INTO categories (name, slug) VALUES
        ('Gold', 'gold'),
        ('House Construction', 'house-construction'),
        ('All Construction Material', 'all-construction-material'),
        ('Electronics', 'electronics'),
        ('Vehicles (2wheeler/4wheeler)', 'vehicles-2wheeler-4wheeler'),
        ('Groceries', 'groceries')");

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
    // Columns queried by customer/agreement.php — add if missing (safe migrations)
    try { $pdo->exec("ALTER TABLE agreements ADD COLUMN agreement_id VARCHAR(50) AFTER id"); } catch (PDOException $e) {}
    try { $pdo->exec("ALTER TABLE agreements ADD COLUMN type VARCHAR(50) DEFAULT 'purchase' AFTER product_id"); } catch (PDOException $e) {}
    try { $pdo->exec("ALTER TABLE agreements ADD COLUMN signed_at DATETIME NULL AFTER status"); } catch (PDOException $e) {}
    try { $pdo->exec("ALTER TABLE agreements ADD COLUMN customer_signed_at DATETIME NULL AFTER signed_at"); } catch (PDOException $e) {}
    // Approval flow sets status to 'active' / 'rejected' — widen the enum so STRICT mode doesn't reject them.
    try { $pdo->exec("ALTER TABLE agreements MODIFY COLUMN status ENUM('pending','active','rejected','verified','legal_review','signed','expired') DEFAULT 'pending'"); } catch (PDOException $e) {}

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

    // 12. Feedback & Remarks Table (bidirectional: customer <-> admin/manager)
    //  - direction 'customer_to_admin' : customer feedback/remark to the company
    //  - direction 'admin_to_customer' : admin/manager feedback/remark to a client
    $pdo->exec("CREATE TABLE IF NOT EXISTS feedbacks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        from_user_id INT NOT NULL,
        to_user_id INT NULL,
        from_role VARCHAR(20) DEFAULT 'customer',
        direction ENUM('customer_to_admin','admin_to_customer') DEFAULT 'customer_to_admin',
        subject VARCHAR(255) DEFAULT NULL,
        message TEXT NOT NULL,
        rating TINYINT DEFAULT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // 13. Offers / Festival Banners Table (shown as a popup on login)
    $pdo->exec("CREATE TABLE IF NOT EXISTS offers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT DEFAULT NULL,
        image VARCHAR(255) DEFAULT NULL,
        badge VARCHAR(50) DEFAULT 'OFFER',
        color VARCHAR(20) DEFAULT 'blue',
        is_active TINYINT(1) DEFAULT 1,
        starts_at DATETIME DEFAULT NULL,
        ends_at DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // --- SEED INITIAL DATA ---
    // Sample-product seeding intentionally DISABLED after the full data reset so the
    // catalog stays empty until real products are added via Admin → Asset Inventory.
    // (Re-enable by restoring `if ($count == 0)` below.)
    if (false) {
        $pdo->exec("INSERT INTO products (name, category, slug, weight, purity, price, description, is_active) VALUES
            ('22K Gold Coin (1g)', 'Gold', '22k-gold-coin-1g', 1.000, '22K', 7850.00, 'Pure 22K Gold Coin with BIS Hallmark.', 1),
            ('22K Gold Coin (2g)', 'Gold', '22k-gold-coin-2g', 2.000, '22K', 15700.00, 'Pure 22K Gold Coin with BIS Hallmark.', 1),
            ('22K Gold Coin (5g)', 'Gold', '22k-gold-coin-5g', 11.997, '22K', 39255.00, 'Pure 22K Gold Coin with BIS Hallmark.', 1)");
    }

    // Seed Admin if not exists
    $adminCount = $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'admin'")->fetchColumn();
    if ($adminCount == 0) {
        $pdo->prepare("INSERT INTO users (name, email, password, role, referral_code, status) VALUES (?, ?, ?, ?, ?, ?)")
            ->execute(['Super Admin', 'admin@makkalgold.com', 'admin123', 'admin', 'ADMIN001', 'active']);
    }

    // Manager auto-seed DISABLED after the full data reset — only the admin login is kept.
    // (Re-enable by restoring `if ($managerCount == 0)` below.)
    $managerCount = $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'manager'")->fetchColumn();
    if (false) {
        $pdo->prepare("INSERT INTO users (name, email, password, role, referral_code, status) VALUES (?, ?, ?, ?, ?, ?)")
            ->execute(['Operations Manager', 'manager@makkalgold.com', 'manager123', 'manager', 'MGR001', 'active']);
    }

    // Ensure existing admins/managers are active
    $pdo->exec("UPDATE users SET status = 'active' WHERE role IN ('admin', 'manager')");

    // --- VEV ID SYSTEM (customer_id + product_code + VEV referral codes) ---
    // New columns (idempotent; multiple NULLs allowed under a UNIQUE index in MySQL)
    try { $pdo->exec("ALTER TABLE users ADD COLUMN customer_id VARCHAR(20) UNIQUE AFTER id"); } catch (PDOException $e) {}
    try { $pdo->exec("ALTER TABLE products ADD COLUMN product_code VARCHAR(20) UNIQUE AFTER id"); } catch (PDOException $e) {}

    // Unique VEV referral code generator: VEV + 5 alphanumeric chars (e.g. VEV342AB)
    if (!function_exists('vevGenerateReferralCode')) {
        function vevGenerateReferralCode($pdo) {
            $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            $check = $pdo->prepare("SELECT id FROM users WHERE referral_code = ?");
            do {
                $suffix = '';
                for ($i = 0; $i < 5; $i++) { $suffix .= $chars[random_int(0, strlen($chars) - 1)]; }
                $code = 'VEV' . $suffix;
                $check->execute([$code]);
            } while ($check->fetch());
            return $code;
        }
    }

    // The admin dashboard fires ~11 API requests in parallel, so multiple processes may run
    // this backfill at once and collide on the UNIQUE indexes. Each assignment is therefore
    // guarded individually: a transient collision is swallowed and simply retried (with a
    // freshly recomputed next-id) on the next request — the loops are idempotent.
    try {
        // Backfill: convert any legacy (non-VEV) referral codes to VEV format. Idempotent —
        // once a row starts with VEV it is skipped on subsequent requests.
        $legacyRefs = $pdo->query("SELECT id FROM users WHERE referral_code IS NULL OR referral_code = '' OR referral_code NOT LIKE 'VEV%'")
                          ->fetchAll(PDO::FETCH_COLUMN);
        if ($legacyRefs) {
            $updRef = $pdo->prepare("UPDATE users SET referral_code = ? WHERE id = ?");
            foreach ($legacyRefs as $uid) {
                try { $updRef->execute([vevGenerateReferralCode($pdo), $uid]); } catch (PDOException $e) {}
            }
        }

        // Backfill: assign sequential VEV### customer IDs to users that lack one (ordered by id)
        $missingCust = $pdo->query("SELECT id FROM users WHERE customer_id IS NULL OR customer_id = '' ORDER BY id ASC")
                           ->fetchAll(PDO::FETCH_COLUMN);
        foreach ($missingCust as $uid) {
            try {
                $maxCust = (int)$pdo->query("SELECT COALESCE(MAX(CAST(SUBSTRING(customer_id, 4) AS UNSIGNED)), 0) FROM users WHERE customer_id LIKE 'VEV%'")->fetchColumn();
                $pdo->prepare("UPDATE users SET customer_id = ? WHERE id = ? AND (customer_id IS NULL OR customer_id = '')")
                    ->execute(['VEV' . str_pad($maxCust + 1, 3, '0', STR_PAD_LEFT), $uid]);
            } catch (PDOException $e) {}
        }

        // Backfill: assign sequential VEVP### product codes to products that lack one (ordered by id)
        $missingProd = $pdo->query("SELECT id FROM products WHERE product_code IS NULL OR product_code = '' ORDER BY id ASC")
                           ->fetchAll(PDO::FETCH_COLUMN);
        foreach ($missingProd as $pid) {
            try {
                $maxProd = (int)$pdo->query("SELECT COALESCE(MAX(CAST(SUBSTRING(product_code, 5) AS UNSIGNED)), 0) FROM products WHERE product_code LIKE 'VEVP%'")->fetchColumn();
                $pdo->prepare("UPDATE products SET product_code = ? WHERE id = ? AND (product_code IS NULL OR product_code = '')")
                    ->execute(['VEVP' . str_pad($maxProd + 1, 3, '0', STR_PAD_LEFT), $pid]);
            } catch (PDOException $e) {}
        }
    } catch (PDOException $e) {
        // Never let ID backfill break normal request handling.
    }

} catch (PDOException $e) {
    die(json_encode(["status" => "error", "message" => "Database Connection/Init failed: " . $e->getMessage()]));
}

// Global $pdo for backward compatibility if needed
$db = $pdo;
?>
