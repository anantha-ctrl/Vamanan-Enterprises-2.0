<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../config.php';
require_once '../mail_helper.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

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
        foreach (["phone", "status", "permissions"] as $optionalColumn) {
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

                // --- Generate Fintech OTP for Login Flow ---
                $otp = sprintf("%06d", mt_rand(100000, 999999));
                $otp_hash = password_hash($otp, PASSWORD_DEFAULT);
                $expires_at = date('Y-m-d H:i:s', strtotime('+10 minutes'));

                // Invalidate old login OTP sessions for this email
                $delStmt = $pdo->prepare("DELETE FROM login_otps WHERE email = ?");
                $delStmt->execute([$user['email']]);

                // Insert new OTP record
                $insStmt = $pdo->prepare("INSERT INTO login_otps (email, otp_hash, expires_at) VALUES (?, ?, ?)");
                $insStmt->execute([$user['email'], $otp_hash, $expires_at]);

                // Dispatch email
                sendLoginOTPMail($user['email'], $otp);

                echo json_encode([
                    "status" => "otp_required",
                    "message" => "Security verification code dispatched to your registered email address.",
                    "email" => $user['email']
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
