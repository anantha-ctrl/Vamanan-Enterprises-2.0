<?php
// api/admin/reconcile_payouts.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

date_default_timezone_set('Asia/Kolkata');
require_once '../config/db.php';

$database = new Database();
$db = $database->getConnection();

try {
    if (!$db) throw new Exception("Database connection failed");
    $db->exec("SET time_zone = '+05:30'");
    
    // Migration check: Ensure failure_reason column exists
    $stmt = $db->query("SHOW COLUMNS FROM transactions LIKE 'failure_reason'");
    if (!$stmt->fetch()) {
        $db->exec("ALTER TABLE transactions ADD COLUMN failure_reason TEXT AFTER status");
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Migration failed: " . $e->getMessage()]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['results']) || !is_array($data['results'])) {
    echo json_encode(["status" => "error", "message" => "Invalid reconciliation data"]);
    exit;
}

try {
    $db->beginTransaction();

    $successCount = 0;
    $failedCount = 0;

    $stmt = $db->prepare("UPDATE transactions SET status = ?, failure_reason = ?, updated_at = NOW() WHERE id = ? AND category = 'cashback'");

    foreach ($data['results'] as $res) {
        $status = strtolower($res['status']); // 'success' or 'failed'
        $reason = $res['reason'] ?? null;
        $id = intval($res['transaction_id']);

        $stmt->execute([$status, $reason, $id]);
        
        if ($status === 'success') $successCount++;
        else $failedCount++;
    }

    // Optional: Log this reconciliation event in a new table if needed
    // $db->exec("INSERT INTO activity_logs ...");

    $db->commit();
    echo json_encode([
        "status" => "success", 
        "message" => "Reconciliation complete",
        "data" => [
            "success" => $successCount,
            "failed" => $failedCount
        ]
    ]);
} catch (Exception $e) {
    $db->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
