<?php
// api/admin/update_user.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once '../config/db.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id)) {
    try {
        $fields = [];
        $params = [':id' => $data->id];

        if (isset($data->role)) {
            $fields[] = "role = :role";
            $params[':role'] = $data->role;
        }
        if (isset($data->kyc_status)) {
            $fields[] = "kyc_status = :kyc_status";
            $params[':kyc_status'] = $data->kyc_status;
        }
        if (isset($data->status)) {
            $fields[] = "status = :status";
            $params[':status'] = $data->status;
        }
        if (isset($data->password)) {
            $fields[] = "password = :password";
            $params[':password'] = $data->password;
        }

        if (empty($fields)) {
            echo json_encode(["status" => "error", "message" => "No fields to update"]);
            exit;
        }

        $query = "UPDATE users SET " . implode(", ", $fields) . " WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->execute($params);

        echo json_encode(["status" => "success", "message" => "User updated successfully"]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "User ID required"]);
}
?>
