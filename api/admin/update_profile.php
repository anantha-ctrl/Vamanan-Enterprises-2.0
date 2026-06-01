<?php
// api/admin/update_profile.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require_once '../config/db.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"), true);

// For now, since we only have one superadmin, we'll update the 'admin' role user
// In a full system, you'd use the session user ID
if (!empty($data['name']) && !empty($data['email'])) {
    try {
        $query = "UPDATE users SET name = :name, email = :email WHERE role = 'superadmin' OR role = 'admin' LIMIT 1";
        $stmt = $db->prepare($query);
        
        $params = [
            'name' => $data['name'],
            'email' => $data['email']
        ];

        // If password is provided, update it too
        if (!empty($data['password'])) {
            $query = "UPDATE users SET name = :name, email = :email, password = :password WHERE role = 'superadmin' OR role = 'admin' LIMIT 1";
            $stmt = $db->prepare($query);
            $params['password'] = $data['password'];
        }

        if ($stmt->execute($params)) {
            echo json_encode(["status" => "success", "message" => "Profile updated successfully"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Update failed"]);
        }
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Incomplete data"]);
}
?>
