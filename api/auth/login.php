<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require_once '../config.php';
require_once '../mail_helper.php';

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->email) && !empty($data->password)) {
    try {
        try {
            $pdo->exec("ALTER TABLE users ADD COLUMN permissions TEXT");
        } catch (PDOException $e) {
            // Column already exists or the DB user cannot alter it; login can still continue.
        }

        $userColumns = $pdo->query("SHOW COLUMNS FROM users")->fetchAll(PDO::FETCH_COLUMN);
        $selectColumns = ["id", "name", "email", "password", "role"];
        foreach (["phone", "status", "permissions", "customer_id", "referral_code"] as $optionalColumn) {
            if (in_array($optionalColumn, $userColumns, true)) {
                $selectColumns[] = $optionalColumn;
            }
        }

        $stmt = $pdo->prepare("SELECT " . implode(", ", $selectColumns) . " FROM users WHERE email = ?");
        $stmt->execute([$data->email]);
        $user = $stmt->fetch();

        if($user) {
            // Check password using both plain text and hashed comparison for compatibility
            $isPlainMatch = ($data->password === $user['password']);
            $isHashMatch = password_verify($data->password, $user['password']);

            if($isPlainMatch || $isHashMatch) {
                // Check account status
                $accountStatus = $user['status'] ?? 'active';
                if ($accountStatus === 'pending') {
                    echo json_encode(["status" => "error", "message" => "Your account is pending admin approval."]);
                    exit;
                }
                if ($accountStatus === 'suspended') {
                    echo json_encode(["status" => "error", "message" => "Your account has been suspended. Please contact admin."]);
                    exit;
                }

                // --- Direct login (OTP verification disabled) ---
                unset($user['password']);
                $user['phone'] = $user['phone'] ?? '';
                $user['status'] = $accountStatus;
                $user['permissions'] = $user['permissions'] ?? '';

                echo json_encode([
                    "status" => "success",
                    "message" => "Welcome back, " . $user['name'],
                    "user" => $user
                ]);
            } else {
                echo json_encode(["status" => "error", "message" => "Incorrect password. Please try again."]);
            }
        } else {
            echo json_encode(["status" => "error", "message" => "No account found with this email."]);
        }
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Email and password are required."]);
}
?>
