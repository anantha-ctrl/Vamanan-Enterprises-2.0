<?php
// api/admin/activity_logs.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/db.php';
require_once '../config/migrate.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    die(json_encode(["status" => "error", "message" => "Database connection failed"]));
}

// Run migrations to ensure all tables and columns are initialized
runMigrations($db);

try {
    $logs = [];

    // 1. Recent Registrations
    $userStmt = $db->query("SELECT name, created_at FROM users WHERE role = 'customer' ORDER BY created_at DESC LIMIT 5");
    while($row = $userStmt->fetch(PDO::FETCH_ASSOC)) {
        $logs[] = [
            "type" => "user",
            "title" => "Node Initialized",
            "desc" => "New investor " . $row['name'] . " joined the network",
            "time" => $row['created_at'],
            "icon" => "UserPlus",
            "color" => "text-blue-600",
            "bg" => "bg-blue-50"
        ];
    }

    // 2. Recent Approved Investments
    $invStmt = $db->query("SELECT u.name, t.amount, t.created_at FROM transactions t JOIN wallets w ON t.wallet_id = w.id JOIN users u ON w.user_id = u.id WHERE t.category = 'purchase' AND t.status = 'completed' ORDER BY t.created_at DESC LIMIT 5");
    while($row = $invStmt->fetch(PDO::FETCH_ASSOC)) {
        $logs[] = [
            "type" => "investment",
            "title" => "Capital Infusion",
            "desc" => "₹" . number_format($row['amount']) . " investment verified for " . $row['name'],
            "time" => $row['created_at'],
            "icon" => "ShieldCheck",
            "color" => "text-emerald-600",
            "bg" => "bg-emerald-50"
        ];
    }

    // 3. Recent Withdrawals
    $witStmt = $db->query("SELECT u.name, t.amount, t.created_at FROM transactions t JOIN wallets w ON t.wallet_id = w.id JOIN users u ON w.user_id = u.id WHERE t.category = 'withdrawal' AND t.status = 'completed' ORDER BY t.created_at DESC LIMIT 5");
    while($row = $witStmt->fetch(PDO::FETCH_ASSOC)) {
        $logs[] = [
            "type" => "withdrawal",
            "title" => "Asset Liquidation",
            "desc" => "₹" . number_format($row['amount']) . " payout processed for " . $row['name'],
            "time" => $row['created_at'],
            "icon" => "Wallet",
            "color" => "text-amber-600",
            "bg" => "bg-amber-50"
        ];
    }

    // Sort by time
    usort($logs, function($a, $b) {
        return strtotime($b['time']) - strtotime($a['time']);
    });

    // Limit to 6
    $logs = array_slice($logs, 0, 6);

    echo json_encode([
        "status" => "success",
        "data" => $logs
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
