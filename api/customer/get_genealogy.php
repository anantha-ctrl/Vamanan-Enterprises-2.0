<?php
// api/customer/get_genealogy.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

date_default_timezone_set('Asia/Kolkata');

require_once '../config.php';
$db = $pdo;

try {
    $userId = $_GET['user_id'] ?? null;
    if (!$userId) {
        throw new Exception("User ID is required");
    }

    function getDownline($db, $parentId, $level = 1) {
        if ($level > 5) return [];

        $stmt = $db->prepare("
            SELECT id, name, email, referral_code, created_at, kyc_status
            FROM users 
            WHERE referrer_id = ?
        ");
        $stmt->execute([$parentId]);
        $children = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($children as &$child) {
            // Get total investment for this child
            $invStmt = $db->prepare("SELECT SUM(total_value) as total_inv FROM cashback_cycles WHERE user_id = ? AND status = 'active'");
            $invStmt->execute([$child['id']]);
            $child['total_investment'] = (float)($invStmt->fetch(PDO::FETCH_ASSOC)['total_inv'] ?? 0);
            
            // Get their children
            $child['level'] = $level;
            $child['downline'] = getDownline($db, $child['id'], $level + 1);
        }

        return $children;
    }

    $tree = getDownline($db, $userId);

    echo json_encode([
        "status" => "success",
        "data" => $tree
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
