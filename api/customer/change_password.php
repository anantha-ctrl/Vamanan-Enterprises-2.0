<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->user_id) && !empty($data->new_password)) {
    try {
        // Update to new password directly as requested
        $updateStmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
        $updateStmt->execute([$data->new_password, $data->user_id]);

        if ($updateStmt->rowCount() > 0) {
            echo json_encode(["status" => "success", "message" => "Credential key updated successfully!"]);
        } else {
            echo json_encode(["status" => "error", "message" => "User not found or no change made."]);
        }

    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Missing required fields."]);
}
?>
