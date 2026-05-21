<?php
// api/admin/add_staff.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once '../config.php';
require_once '../config/migrate.php';
$db = $pdo;

// Synchronize database schema
runMigrations($db);

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->name) && !empty($data->email) && !empty($data->password) && !empty($data->role)) {
    // 1. Check if user exists
    $checkQuery = "SELECT id FROM users WHERE email = :email";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->execute(['email' => $data->email]);
    
    if($checkStmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Email already registered."]);
        exit;
    }

    $referralCode = strtoupper(substr(md5(uniqid()), 0, 8));

    try {
        $db->beginTransaction();

        // 2. Create Staff User
        $query = "INSERT INTO users (name, email, password, role, referral_code, permissions) 
                  VALUES (:name, :email, :password, :role, :referral_code, :permissions)";
        
        $stmt = $db->prepare($query);
        $stmt->execute([
            'name' => $data->name,
            'email' => $data->email,
            'password' => $data->password, // Stored as plain text per project pattern
            'role' => $data->role,
            'referral_code' => $referralCode,
            'permissions' => isset($data->permissions) ? (is_array($data->permissions) ? json_encode($data->permissions) : $data->permissions) : null
        ]);

        $userId = $db->lastInsertId();

        // 3. Initialize Wallet
        $walletQuery = "INSERT INTO wallets (user_id, balance) VALUES (:user_id, 0.00)";
        $walletStmt = $db->prepare($walletQuery);
        $walletStmt->execute(['user_id' => $userId]);

        $db->commit();

        echo json_encode([
            "status" => "success",
            "message" => "Staff account created successfully.",
            "user_id" => $userId
        ]);

    } catch (Exception $e) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Server error: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Please fill all required fields."]);
}
?>
