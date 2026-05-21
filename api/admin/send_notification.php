<?php
// api/admin/send_notification.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../config.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['title']) || !isset($data['message'])) {
    die(json_encode(["status" => "error", "message" => "Missing title or message"]));
}

$user_id = isset($data['user_id']) && $data['user_id'] !== '' ? $data['user_id'] : null;
$title = $data['title'];
$message = $data['message'];
$type = isset($data['type']) ? $data['type'] : 'info';

try {
    $stmt = $pdo->prepare("INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)");
    $stmt->execute([$user_id, $title, $message, $type]);
    
    echo json_encode(["status" => "success", "message" => "Notification dispatched successfully"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Dispatch failed: " . $e->getMessage()]);
}
?>
