<?php
// api/customer/get_feedback.php — customer views feedback/remarks the admin/manager sent to them,
// plus their own submitted feedback (thread view).
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../config.php';

$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
if (!$user_id) {
    echo json_encode(["status" => "error", "message" => "user_id required"]);
    exit;
}

try {
    // Feedback FROM admin/manager TO this customer
    $inStmt = $pdo->prepare("SELECT f.*, u.name AS from_name, u.role AS sender_role
                             FROM feedbacks f
                             LEFT JOIN users u ON f.from_user_id = u.id
                             WHERE f.direction = 'admin_to_customer' AND f.to_user_id = ?
                             ORDER BY f.created_at DESC");
    $inStmt->execute([$user_id]);
    $received = $inStmt->fetchAll(PDO::FETCH_ASSOC);

    // Feedback this customer sent
    $outStmt = $pdo->prepare("SELECT * FROM feedbacks
                              WHERE direction = 'customer_to_admin' AND from_user_id = ?
                              ORDER BY created_at DESC");
    $outStmt->execute([$user_id]);
    $sent = $outStmt->fetchAll(PDO::FETCH_ASSOC);

    // Mark received as read
    $pdo->prepare("UPDATE feedbacks SET is_read = 1 WHERE direction = 'admin_to_customer' AND to_user_id = ?")->execute([$user_id]);

    echo json_encode([
        "status" => "success",
        "data" => [
            "received" => $received,
            "sent" => $sent,
            "unread_count" => count(array_filter($received, fn($r) => (int)$r['is_read'] === 0))
        ]
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
