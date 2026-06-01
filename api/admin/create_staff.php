<?php
// api/admin/create_staff.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/db.php';
require_once '../config/migrate.php';

$database = new Database();
$db = $database->getConnection();
$data = json_decode(file_get_contents("php://input"));

if (!$db) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database connection failed."]);
    exit;
}

runMigrations($db);

if(!empty($data->name) && !empty($data->email) && !empty($data->role) && !empty($data->password)) {
    try {
        $allowedRoles = ['manager', 'staff', 'advocate'];
        $role = strtolower(trim($data->role));
        if (!in_array($role, $allowedRoles, true)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Invalid staff role."]);
            exit;
        }

        $permissions = [];
        if (isset($data->permissions)) {
            $permissions = is_array($data->permissions) ? $data->permissions : json_decode($data->permissions, true);
            if (!is_array($permissions)) $permissions = [];
        }

        $query = "INSERT INTO users (name, email, password, role, status, permissions) VALUES (:name, :email, :password, :role, 'active', :permissions)";
        $stmt = $db->prepare($query);
        if($stmt->execute([
            'name' => $data->name,
            'email' => $data->email,
            'password' => $data->password, // Stored as plain text as requested earlier
            'role' => $role,
            'permissions' => json_encode($permissions)
        ])) {
            echo json_encode(["status" => "success", "message" => "New " . $role . " added successfully."]);
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
