<?php
// api/admin/payout_reports.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

date_default_timezone_set('Asia/Kolkata');
require_once '../config/db.php';

$database = new Database();
$db = $database->getConnection();
$db->exec("SET time_zone = '+05:30'");

try {
    // 1. Summary Stats (Unified Cashflows)
    $summaryStmt = $db->query("
        SELECT 
            SUM(CASE WHEN status IN ('success', 'completed') THEN amount ELSE 0 END) as success_amount,
            SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
            SUM(CASE WHEN status = 'failed' THEN amount ELSE 0 END) as failed_amount,
            COUNT(*) as total_count,
            COUNT(CASE WHEN status IN ('success', 'completed') THEN 1 END) as success_count,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
            COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
        FROM transactions 
        WHERE category IN ('cashback', 'referral')
    ");
    $summary = $summaryStmt->fetch(PDO::FETCH_ASSOC);

    // 2. Chart Data (Last 15 days of disbursements)
    $chartStmt = $db->query("
        SELECT 
            DATE(created_at) as date,
            SUM(amount) as total_amount
        FROM transactions 
        WHERE category IN ('cashback', 'referral') 
          AND created_at >= DATE_SUB(NOW(), INTERVAL 15 DAY)
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) ASC
    ");
    $chartData = $chartStmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Detailed History (Multi-Node Ledger)
    $historyStmt = $db->query("
        SELECT 
            t.*, 
            u.name as user_name, 
            u.email as user_email,
            u.bank_name,
            u.account_no,
            u.ifsc_code
        FROM transactions t
        JOIN wallets w ON t.wallet_id = w.id
        JOIN users u ON w.user_id = u.id
        WHERE t.category IN ('cashback', 'referral')
        ORDER BY t.created_at DESC
        LIMIT 500
    ");
    $history = $historyStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => [
            "summary" => $summary,
            "chart" => $chartData,
            "history" => $history
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
