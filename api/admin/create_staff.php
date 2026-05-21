<?php
// api/admin/create_staff.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/db.php';

$database = new Database();
$db = $database->getConnection();
$data = json_decode(file_get_contents("php://input"));

if(!empty($data->name) && !empty($data->email) && !empty($data->role) && !empty($data->password)) {
    try {
        $query = "INSERT INTO users (name, email, password, role) VALUES (:name, :email, :password, :role)";
        $stmt = $db->prepare($query);
        if($stmt->execute([
            'name' => $data->name,
            'email' => $data->email,
            'password' => $data->password, // Stored as plain text as requested earlier
            'role' => $data->role
        ])) {
            echo json_encode(["status" => "success", "message" => "New " . $data->role . " added successfully."]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing required fields."]);
}
?>
