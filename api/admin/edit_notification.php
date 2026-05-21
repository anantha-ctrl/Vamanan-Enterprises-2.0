<?php
// api/admin/edit_notification.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../config.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['id']) || !isset($data['title']) || !isset($data['message'])) {
    die(json_encode(["status" => "error", "message" => "Missing required data"]));
}

$id = $data['id'];
$user_id = isset($data['user_id']) && $data['user_id'] !== '' ? $data['user_id'] : null;
$title = $data['title'];
$message = $data['message'];
$type = $data['type'];

try {
    $stmt = $pdo->prepare("UPDATE notifications SET user_id = ?, title = ?, message = ?, type = ? WHERE id = ?");
    $stmt->execute([$user_id, $title, $message, $type, $id]);
    
    echo json_encode(["status" => "success", "message" => "Notification updated successfully"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Update failed: " . $e->getMessage()]);
}
?>
