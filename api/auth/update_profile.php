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

if (!empty($data['user_id']) && !empty($data['name']) && !empty($data['email'])) {
    try {
        $query = "UPDATE users SET name = :name, email = :email, phone = :phone WHERE id = :id";
        $stmt = $db->prepare($query);
        
        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':email', $data['email']);
        $stmt->bindParam(':phone', $data['phone']);
        $stmt->bindParam(':id', $data['user_id']);

        if ($stmt->execute()) {
            // Fetch updated user data to return
            $query = "SELECT * FROM users WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $data['user_id']);
            $stmt->execute();
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            unset($user['password']); // Safety

            echo json_encode(["status" => "success", "message" => "Identity Protocol Synchronized", "user" => $user]);
        } else {
            echo json_encode(["status" => "error", "message" => "Identity Update Failed"]);
        }
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Database Node Failure"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Incomplete Identity Data"]);
}
?>
