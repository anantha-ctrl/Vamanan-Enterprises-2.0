<?php
// api/customer/delete_notification.php
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

try {
    // Delete the notification if it belongs to the user or if it's a broadcast (though broadcast delete usually hides it, here we just delete if authorized)
    // To prevent deleting broadcasts for everyone, we only allow deleting if user_id matches.
    // If it's a broadcast (user_id IS NULL), we might want to just hide it for the user, but that needs another table.
    // For now, let's allow users to delete their own notifications.
    
    $stmt = $pdo->prepare("DELETE FROM notifications WHERE id = ? AND user_id = ?");
    $stmt->execute([$notif_id, $user_id]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode(["status" => "success", "message" => "Notification deleted"]);
    } else {
        // If it was a broadcast, we can't delete it from the main table without affecting others.
        echo json_encode(["status" => "error", "message" => "Could not delete notification. Personal notifications only."]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Delete failed: " . $e->getMessage()]);
}
?>
