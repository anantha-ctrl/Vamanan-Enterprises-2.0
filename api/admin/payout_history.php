<?php
// api/admin/payout_history.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

date_default_timezone_set('Asia/Kolkata');

require_once '../config/db.php';

$database = new Database();
$db = $database->getConnection();

try {
    if (!$db) throw new Exception("Database connection failed");
    
    $db->exec("SET time_zone = '+05:30'");

    // Migration check: Ensure bank detail columns exist in users table
    $colsCheck = $db->query("SHOW COLUMNS FROM users");
    $cols = $colsCheck->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('bank_name', $cols)) {
        $db->exec("ALTER TABLE users ADD COLUMN bank_name VARCHAR(255) AFTER avatar");
    }
    if (!in_array('account_no', $cols)) {
        $db->exec("ALTER TABLE users ADD COLUMN account_no VARCHAR(50) AFTER bank_name");
    }
    if (!in_array('ifsc_code', $cols)) {
        $db->exec("ALTER TABLE users ADD COLUMN ifsc_code VARCHAR(20) AFTER account_no");
    }
    // 1. Get Summary Stats
    $stats = [];
    
    // Today's Cashback
    $stmt = $db->prepare("SELECT SUM(amount) as today FROM transactions WHERE category = 'cashback' AND DATE(created_at) = CURDATE()");
    $stmt->execute();
    $stats['today'] = (float)($stmt->fetch(PDO::FETCH_ASSOC)['today'] ?? 0);

    // Monthly Cashback
    $stmt = $db->prepare("SELECT SUM(amount) as monthly FROM transactions WHERE category = 'cashback' AND MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())");
    $stmt->execute();
    $stats['monthly'] = (float)($stmt->fetch(PDO::FETCH_ASSOC)['monthly'] ?? 0);

    // Total Active Cycles
    $stmt = $db->prepare("SELECT COUNT(*) as active FROM cashback_cycles WHERE status = 'active'");
    $stmt->execute();
    $stats['active_cycles'] = (int)($stmt->fetch(PDO::FETCH_ASSOC)['active'] ?? 0);

    // Last Run Date
    $stmt = $db->prepare("SELECT MAX(last_paid_at) as last_run FROM cashback_cycles");
    $stmt->execute();
    $stats['last_run'] = $stmt->fetch(PDO::FETCH_ASSOC)['last_run'] ?? 'Never';

    // Total Paid All Time
    $stmt = $db->prepare("SELECT SUM(amount) as total FROM transactions WHERE category = 'cashback'");
    $stmt->execute();
    $stats['total_paid'] = (float)($stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);

    // 2. Get Recent Payouts with User/Bank info
    $query = "SELECT 
                t.id, 
                t.amount, 
                t.status, 
                t.description, 
                t.created_at,
                u.name as user_name,
                u.email as user_email,
                u.bank_name,
                u.account_no,
                u.ifsc_code,
                c.id as cycle_id,
                c.days_paid as current_day
              FROM transactions t
              JOIN wallets w ON t.wallet_id = w.id
              JOIN users u ON w.user_id = u.id
              LEFT JOIN cashback_cycles c ON u.id = c.user_id AND t.description LIKE CONCAT('%Cycle #', c.id, '%')
              WHERE t.category = 'cashback'
              ORDER BY t.created_at DESC
              LIMIT 100";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    $payouts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "stats" => $stats,
        "data" => $payouts
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
