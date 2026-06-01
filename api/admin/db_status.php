<?php
// api/admin/db_status.php — one-time DB diagnostic & auto-repair
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once '../config/db.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Cannot connect to database"]);
    exit;
}

// ── 1. Auto-run all migrations from config.php ──────────────────────────────
// Include the self-healing config (creates all tables, adds missing columns)
try {
    // Re-run config.php migrations inline
    $migrations = [
        // Products – correct columns
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
        "ALTER TABLE products ADD COLUMN image VARCHAR(255) AFTER price",
        "ALTER TABLE products ADD COLUMN is_active TINYINT(1) DEFAULT 1 AFTER description",

        // Categories
        "CREATE TABLE IF NOT EXISTS categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",

        // Fix cashback_cycles asset_type to include 'product'
        "ALTER TABLE cashback_cycles ADD COLUMN asset_type ENUM('gold','silver','product') DEFAULT 'gold' AFTER user_id",
        "ALTER TABLE cashback_cycles MODIFY COLUMN asset_type ENUM('gold','silver','product') DEFAULT 'gold'",
        "ALTER TABLE cashback_cycles ADD COLUMN product_id INT DEFAULT NULL AFTER weight",
        "ALTER TABLE cashback_cycles ADD COLUMN product_name VARCHAR(255) DEFAULT NULL AFTER product_id",
        "ALTER TABLE cashback_cycles ADD COLUMN payment_method VARCHAR(50) DEFAULT 'Bank Transfer' AFTER transaction_id",
        "ALTER TABLE cashback_cycles ADD COLUMN weight DECIMAL(10,3) DEFAULT 0 AFTER asset_type",

        // Notifications user_id index
        "ALTER TABLE notifications ADD INDEX idx_user (user_id)",

        // Activity logs
        "CREATE TABLE IF NOT EXISTS activity_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            action VARCHAR(255) NOT NULL,
            details TEXT,
            ip_address VARCHAR(45),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",

        // Disputes
        "CREATE TABLE IF NOT EXISTS disputes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            dispute_id VARCHAR(50) UNIQUE,
            subject VARCHAR(255),
            description TEXT,
            priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
            status ENUM('open','in_resolution','resolved','closed') DEFAULT 'open',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",

        // Compliance audit
        "CREATE TABLE IF NOT EXISTS compliance_audit (
            id INT AUTO_INCREMENT PRIMARY KEY,
            admin_id INT NOT NULL,
            target_user_id INT,
            audit_type VARCHAR(100),
            details TEXT,
            status VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",
    ];

    $migrated = [];
    foreach ($migrations as $sql) {
        try {
            $db->exec($sql);
            $migrated[] = ["sql" => substr($sql, 0, 60) . "...", "status" => "ok"];
        } catch (Exception $e) {
            $migrated[] = ["sql" => substr($sql, 0, 60) . "...", "status" => "skip", "reason" => $e->getMessage()];
        }
    }

    $db->exec("INSERT IGNORE INTO categories (name, slug) VALUES
        ('Gold', 'gold'),
        ('House Construction', 'house-construction'),
        ('All Construction Material', 'all-construction-material'),
        ('Electronics', 'electronics'),
        ('Vehicles (2wheeler/4wheeler)', 'vehicles-2wheeler-4wheeler'),
        ('Groceries', 'groceries')");

} catch (Exception $e) {
    // Non-fatal
}

// ── 2. List all tables with column count and row count ──────────────────────
$tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);

$tableInfo = [];
foreach ($tables as $tbl) {
    $cols = $db->query("SHOW COLUMNS FROM `$tbl`")->fetchAll(PDO::FETCH_ASSOC);
    $rows = $db->query("SELECT COUNT(*) FROM `$tbl`")->fetchColumn();
    $tableInfo[] = [
        "table"   => $tbl,
        "columns" => count($cols),
        "rows"    => (int)$rows,
        "fields"  => array_column($cols, 'Field'),
    ];
}

// ── 3. FK relationships ─────────────────────────────────────────────────────
$fks = $db->query("
    SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME,
           DELETE_RULE
    FROM information_schema.KEY_COLUMN_USAGE k
    JOIN information_schema.REFERENTIAL_CONSTRAINTS r
      ON k.CONSTRAINT_NAME = r.CONSTRAINT_NAME
     AND k.CONSTRAINT_SCHEMA = r.CONSTRAINT_SCHEMA
    WHERE k.TABLE_SCHEMA = 'makkal_gold'
      AND k.REFERENCED_TABLE_NAME IS NOT NULL
")->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    "status"     => "success",
    "db"         => "makkal_gold",
    "tables"     => $tableInfo,
    "fk_rules"   => $fks,
    "total_tables" => count($tableInfo),
], JSON_PRETTY_PRINT);
?>
