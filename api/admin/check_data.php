<?php
// api/admin/check_data.php
header("Content-Type: application/json");
require_once '../config/db.php';

$database = new Database();
$db = $database->getConnection();

try {
    if (!$db) throw new Exception("Database connection failed");
    $db->exec("SET time_zone = '+05:30'");

    // 1. Get pending withdrawals
    $pending = $db->query("SELECT * FROM withdrawals WHERE status = 'pending' LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);

    // 2. Get active yield cycles
    $activeCycles = $db->query("SELECT u.name, c.total_value, c.days_paid 
                                FROM cashback_cycles c 
                                JOIN users u ON c.user_id = u.id 
                                WHERE c.status = 'active' LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);

    // 3. Get latest cashback payouts (from transactions table)
    $latest = $db->query("SELECT t.*, u.name as user_name 
                          FROM transactions t 
                          JOIN wallets w ON t.wallet_id = w.id 
                          JOIN users u ON w.user_id = u.id 
                          WHERE t.category = 'cashback' 
                          ORDER BY t.created_at DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'pending_withdrawals' => $pending,
        'active_yield_cycles' => $activeCycles,
        'latest_cashback_payouts' => $latest,
        'server_time' => date('Y-m-d H:i:s')
    ]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>