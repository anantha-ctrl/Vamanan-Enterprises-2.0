<?php
// api/customer/orders.php — order / investment history for a customer
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require_once '../config.php';

$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
if (!$user_id) {
    http_response_code(400);
    die(json_encode(["status" => "error", "message" => "user_id required"]));
}

try {
    // Ensure columns added by purchase.php exist before querying
    try { $pdo->exec("ALTER TABLE cashback_cycles ADD COLUMN transaction_id VARCHAR(255)"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE cashback_cycles ADD COLUMN payment_method VARCHAR(50) DEFAULT 'Bank Transfer'"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE cashback_cycles ADD COLUMN payment_screenshot VARCHAR(255)"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE cashback_cycles ADD COLUMN asset_type VARCHAR(20) DEFAULT 'gold'"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE cashback_cycles ADD COLUMN weight DECIMAL(10,3) DEFAULT 0"); } catch (Exception $e) {}

    $stmt = $pdo->prepare("
        SELECT cc.id,
               cc.total_value,
               cc.daily_payout,
               cc.asset_type,
               cc.weight,
               cc.status,
               cc.transaction_id,
               cc.payment_method,
               cc.payment_screenshot,
               cc.created_at,
               p.name  AS product_name,
               p.image AS product_image,
               p.purity,
               p.category
        FROM cashback_cycles cc
        LEFT JOIN agreements agr ON agr.user_id = cc.user_id AND agr.id = (
            SELECT MAX(a2.id) FROM agreements a2 WHERE a2.user_id = cc.user_id
        )
        LEFT JOIN products p ON p.id = agr.product_id
        WHERE cc.user_id = :uid
        ORDER BY cc.id DESC
        LIMIT 30
    ");
    $stmt->execute(['uid' => $user_id]);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "data" => $orders]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
