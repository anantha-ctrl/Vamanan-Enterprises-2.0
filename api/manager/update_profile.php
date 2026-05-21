<?php
// api/manager/update_profile.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require_once '../config/db.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"), true);

if (!empty($data['id']) && !empty($data['name']) && !empty($data['email'])) {
    try {
        $params = [
            'id' => $data['id'],
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? '',
            'notify_email' => isset($data['notify_email']) ? (int)$data['notify_email'] : 1,
            'notify_system' => isset($data['notify_system']) ? (int)$data['notify_system'] : 1
        ];

        $password_clause = "";
        if (!empty($data['password'])) {
            $password_clause = ", password = :password";
            $params['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
        }

        $query = "UPDATE users SET 
                    name = :name, 
                    email = :email, 
                    phone = :phone, 
                    notify_email = :notify_email, 
                    notify_system = :notify_system
                    $password_clause 
                  WHERE id = :id AND role = 'manager'";

        $stmt = $db->prepare($query);
        
        if ($stmt->execute($params)) {
            // Log the activity
            $logStmt = $db->prepare("INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES (:user_id, :action, :details, :ip)");
            $logStmt->execute([
                'user_id' => $data['id'],
                'action' => 'profile_update',
                'details' => 'Manager updated profile details and security settings',
                'ip' => $_SERVER['REMOTE_ADDR']
            ]);

            // Fetch updated user data
            $stmt = $db->prepare("SELECT id, name, email, phone, role, notify_email, notify_system FROM users WHERE id = :id");
            $stmt->execute(['id' => $data['id']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            echo json_encode([
                "status" => "success", 
                "message" => "Institutional profile synchronized",
                "data" => $user
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => "Synchronization failed"]);
        }
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Incomplete configuration data"]);
}
?>
