<?php
// api/admin/wallets.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/db.php';

$database = new Database();
$db = $database->getConnection();

try {
    // Migration check: Ensure total_earned and total_withdrawn exist
    $colsCheck = $db->query("SHOW COLUMNS FROM wallets");
    $cols = $colsCheck->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('total_earned', $cols)) {
        $db->exec("ALTER TABLE wallets ADD COLUMN total_earned DECIMAL(15,2) DEFAULT 0.00 AFTER balance");
    }
    if (!in_array('total_withdrawn', $cols)) {
        $db->exec("ALTER TABLE wallets ADD COLUMN total_withdrawn DECIMAL(15,2) DEFAULT 0.00 AFTER total_earned");
    }

    // Fetch all users with their wallet balances and additional fintech metadata
    $query = "SELECT 
                w.id as wallet_id,
                w.user_id,
                w.balance,
                w.total_earned,
                w.total_withdrawn,
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone,
                u.role,
                u.kyc_status,
                (SELECT COUNT(id) FROM cashback_cycles c WHERE c.user_id = w.user_id AND c.status = 'active') as active_cycles,
                (SELECT MAX(last_paid_at) FROM cashback_cycles c WHERE c.user_id = w.user_id) as last_payout_at,
                (SELECT COUNT(id) FROM transactions t WHERE t.wallet_id = w.id) as tx_count
              FROM wallets w
              JOIN users u ON w.user_id = u.id
              WHERE u.role != 'admin'
              ORDER BY w.balance DESC";
              
    $stmt = $db->prepare($query);
    $stmt->execute();
    $wallets = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => $wallets
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
