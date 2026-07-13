<?php
// api/admin/toggle_referral.php
// Admin control: stop / resume a member's referral commissions.
//   POST { user_id, active: 0|1 }  → sets users.referral_active
// When active = 0, the daily yield engine skips this member for all referral
// commission payouts (their own daily cashback is unaffected).
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require_once '../config.php';   // self-healing: guarantees users.referral_active exists
$db = $pdo;

try {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!is_array($data)) $data = $_POST;

    $userId = $data['user_id'] ?? null;
    if (!$userId) {
        echo json_encode(["status" => "error", "message" => "user_id is required"]);
        exit;
    }
    // Accept active as 0/1/true/false
    $active = isset($data['active']) ? (int)filter_var($data['active'], FILTER_VALIDATE_BOOLEAN) : null;
    if ($active === null && isset($data['active'])) $active = (int)$data['active'];
    if ($active !== 0 && $active !== 1) {
        echo json_encode(["status" => "error", "message" => "active must be 0 or 1"]);
        exit;
    }

    $stmt = $db->prepare("UPDATE users SET referral_active = ? WHERE id = ?");
    $stmt->execute([$active, $userId]);

    // Notify the member so the change is visible to them in real time.
    try {
        $msg = $active === 1
            ? 'Your referral commissions have been re-activated.'
            : 'Your referral commissions have been paused by the administrator.';
        $db->prepare("INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)")
           ->execute([$userId, 'Referral Status Updated', $msg]);
    } catch (Throwable $e) { /* notifications table optional */ }

    echo json_encode([
        "status"  => "success",
        "message" => $active === 1 ? "Referral commissions resumed." : "Referral commissions stopped.",
        "user_id" => (int)$userId,
        "referral_active" => $active
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
