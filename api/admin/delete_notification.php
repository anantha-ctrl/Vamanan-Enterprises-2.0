<?php
// api/admin/delete_notification.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../config.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['id'])) {
    die(json_encode(["status" => "error", "message" => "Missing notification ID"]));
}

$id = $data['id'];

try {
    $stmt = $pdo->prepare("DELETE FROM notifications WHERE id = ?");
    $stmt->execute([$id]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode(["status" => "success", "message" => "Notification retracted successfully"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Notification not found or already deleted"]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Retraction failed: " . $e->getMessage()]);
}
?>
