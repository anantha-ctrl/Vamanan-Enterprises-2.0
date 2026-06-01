<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require_once '../config/db.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"), true);

if (!empty($data['user_id']) && !empty($data['new_password'])) {
    try {
        $query = "UPDATE users SET password = :password WHERE id = :id";
        $stmt = $db->prepare($query);

        $stmt->bindParam(':password', $data['new_password']);
        $stmt->bindParam(':id', $data['user_id']);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Institutional Access Node Updated Successfully"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Protocol Update Failed"]);
        }
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Database Node Failure"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Incomplete Protocol Data"]);
}
?>
