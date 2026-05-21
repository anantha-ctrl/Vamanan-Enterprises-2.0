<?php
// api/admin/update_withdrawal.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require_once '../config/db.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"), true);

if (!empty($data['id']) && !empty($data['status'])) {
    try {
        $query = "UPDATE withdrawals SET status = :status WHERE id = :id";
        $stmt = $db->prepare($query);
        
        if ($stmt->execute(['status' => $data['status'], 'id' => $data['id']])) {
            echo json_encode(["status" => "success", "message" => "Withdrawal status updated"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Update failed"]);
        }
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid data provided"]);
}
?>
