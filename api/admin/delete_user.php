<?php
// api/admin/delete_user.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require_once '../config/db.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

// Support both single id and bulk ids array
$ids = [];
if (!empty($data['ids']) && is_array($data['ids'])) {
    $ids = array_values(array_filter(array_map('intval', $data['ids'])));
} elseif (!empty($data['id'])) {
    $ids = [intval($data['id'])];
}

if (empty($ids)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "User ID(s) required."]);
    exit;
}

$ph = implode(',', array_fill(0, count($ids), '?'));

try {
    $db->beginTransaction();

    // Delete in FK-safe order: deepest children first

    // transactions depend on wallets → delete transactions via wallet subquery
    $db->prepare("DELETE t FROM transactions t
                  INNER JOIN wallets w ON t.wallet_id = w.id
                  WHERE w.user_id IN ($ph)")->execute($ids);

    // wallets
    $db->prepare("DELETE FROM wallets WHERE user_id IN ($ph)")->execute($ids);

    // cashback_cycles
    $db->prepare("DELETE FROM cashback_cycles WHERE user_id IN ($ph)")->execute($ids);

    // withdrawals
    $db->prepare("DELETE FROM withdrawals WHERE user_id IN ($ph)")->execute($ids);

    // agreements
    $db->prepare("DELETE FROM agreements WHERE user_id IN ($ph)")->execute($ids);

    // support_tickets
    $db->prepare("DELETE FROM support_tickets WHERE user_id IN ($ph)")->execute($ids);

    // activity_logs
    $db->prepare("DELETE FROM activity_logs WHERE user_id IN ($ph)")->execute($ids);

    // notifications
    $db->prepare("DELETE FROM notifications WHERE user_id IN ($ph)")->execute($ids);

    // disputes (advocate panel)
    $db->prepare("DELETE FROM disputes WHERE user_id IN ($ph)")->execute($ids);

    // compliance_audit
    $db->prepare("DELETE FROM compliance_audit WHERE target_user_id IN ($ph)")->execute($ids);

    // Finally delete users
    $stmt = $db->prepare("DELETE FROM users WHERE id IN ($ph)");
    $stmt->execute($ids);
    $count = $stmt->rowCount();

    $db->commit();

    echo json_encode([
        "status"  => "success",
        "message" => "$count user(s) deleted successfully.",
        "deleted" => $count
    ]);

} catch (Exception $e) {
    $db->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
