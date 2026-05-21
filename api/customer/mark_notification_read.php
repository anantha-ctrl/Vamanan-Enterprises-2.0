<?php
// api/customer/mark_notification_read.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../config.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['notification_id']) || !isset($data['user_id'])) {
    die(json_encode(["status" => "error", "message" => "Missing parameters"]));
}

$notif_id = $data['notification_id'];
$user_id = $data['user_id'];
$is_read = isset($data['is_read']) ? $data['is_read'] : 1;

try {
    // Update the notification status
    $stmt = $pdo->prepare("UPDATE notifications SET is_read = ? WHERE id = ? AND (user_id = ? OR user_id IS NULL)");
    $stmt->execute([$is_read, $notif_id, $user_id]);
    
    echo json_encode(["status" => "success", "message" => "Status updated"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Update failed: " . $e->getMessage()]);
}
?>
