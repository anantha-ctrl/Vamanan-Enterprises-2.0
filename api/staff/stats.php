<?php
// api/staff/stats.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/db.php';

$database = new Database();
$db = $database->getConnection();

try {
    // 1. Recent System Activity (Last 10 transactions)
    $logQuery = "SELECT u.name, t.category as action, t.amount, t.type, t.created_at 
                  FROM transactions t 
                  JOIN wallets w ON t.wallet_id = w.id 
                  JOIN users u ON w.user_id = u.id 
                  ORDER BY t.created_at DESC LIMIT 10";
    $logStmt = $db->query($logQuery);
    $activityLog = $logStmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. Active Customers (Last 5 registered)
    $userQuery = "SELECT name, email, created_at FROM users WHERE role = 'customer' ORDER BY created_at DESC LIMIT 5";
    $userStmt = $db->query($userQuery);
    $newCustomers = $userStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => [
            "activityLog" => $activityLog,
            "newCustomers" => $newCustomers,
            "totalSupportTickets" => 0 // Placeholder for now
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
