<?php
// api/admin/investment_history.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/db.php';
require_once '../config/migrate.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    die(json_encode(["status" => "error", "message" => "Database connection failed"]));
}

// Ensure database is up to date
runMigrations($db);

try {
    // Fetch processed cycles with user info
    $query = "SELECT 
                c.id as cycle_id, 
                c.user_id, 
                c.total_value, 
                c.daily_payout, 
                c.status as cycle_status,
                c.created_at,
                c.last_paid_at,
                c.transaction_id,
                c.payment_screenshot,
                c.asset_type,
                c.weight,
                u.name as user_name, 
                u.email as user_email
              FROM cashback_cycles c
              JOIN users u ON c.user_id = u.id
              WHERE c.status != 'pending'
              ORDER BY c.id DESC";
              
    $stmt = $db->prepare($query);
    $stmt->execute();
    $cycles = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Enrich with dates and clean up
    $investments = [];
    foreach ($cycles as $cycle) {
        $aStmt = $db->prepare("SELECT a.agreement_date 
                                FROM agreements a 
                                WHERE a.user_id = :uid AND a.status != 'pending' 
                                ORDER BY a.id DESC LIMIT 1");
        $aStmt->execute(['uid' => $cycle['user_id']]);
        $agreement = $aStmt->fetch(PDO::FETCH_ASSOC);

        $cycle['processed_date'] = $agreement['agreement_date'] ?? $cycle['created_at'];
        
        $investments[] = $cycle;
    }

    echo json_encode([
        "status" => "success",
        "data" => $investments
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "HIST_ERR: " . $e->getMessage()]);
}
?>
