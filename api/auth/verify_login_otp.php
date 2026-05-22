<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->email) || !isset($data->otp)) {
    echo json_encode(["status" => "error", "message" => "Email and verification code are required."]);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM login_otps WHERE email = ? LIMIT 1");
    $stmt->execute([$data->email]);
    $session = $stmt->fetch();

    if (!$session) {
        echo json_encode(["status" => "error", "message" => "Security session invalid or expired. Please login again."]);
        exit;
    }

    // Check expiry
    if (strtotime($session['expires_at']) < time()) {
        $stmt = $pdo->prepare("DELETE FROM login_otps WHERE email = ?");
        $stmt->execute([$data->email]);
        echo json_encode(["status" => "error", "message" => "The verification code has expired. Please log in again."]);
        exit;
    }

    // Check attempt limits (max 5 attempts)
    if ($session['attempts'] >= 5) {
        echo json_encode(["status" => "error", "message" => "Too many failed attempts. This login session has been locked for security."]);
        exit;
    }

    // Verify OTP Hash
    if (password_verify((string)$data->otp, $session['otp_hash'])) {
        
        // Fetch User Data for Login Session Creation
        $userColumns = $pdo->query("SHOW COLUMNS FROM users")->fetchAll(PDO::FETCH_COLUMN);
        $selectColumns = ["id", "name", "email", "role"];
        foreach (["phone", "status", "permissions"] as $optionalColumn) {
            if (in_array($optionalColumn, $userColumns, true)) {
                $selectColumns[] = $optionalColumn;
            }
        }

        $stmt = $pdo->prepare("SELECT " . implode(", ", $selectColumns) . " FROM users WHERE email = ?");
        $stmt->execute([$data->email]);
        $user = $stmt->fetch();

        if (!$user) {
            echo json_encode(["status" => "error", "message" => "Associated user profile not found."]);
            exit;
        }

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

        // Invalidate OTP Session upon successful auth
        $stmt = $pdo->prepare("DELETE FROM login_otps WHERE email = ?");
        $stmt->execute([$data->email]);

        $user['phone'] = $user['phone'] ?? '';
        $user['status'] = $accountStatus;
        $user['permissions'] = $user['permissions'] ?? '';

        echo json_encode([
            "status" => "success",
            "message" => "Welcome back, " . $user['name'],
            "user" => $user
        ]);
    } else {
        // Increment attempts
        $stmt = $pdo->prepare("UPDATE login_otps SET attempts = attempts + 1 WHERE email = ?");
        $stmt->execute([$data->email]);
        
        $remaining = 4 - $session['attempts'];
        if ($remaining <= 0) {
            echo json_encode(["status" => "error", "message" => "Too many failed attempts. This login session has been locked."]);
        } else {
            echo json_encode(["status" => "error", "message" => "Incorrect code. $remaining verification attempts remaining."]);
        }
    }

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Critical system error occurred: " . $e->getMessage()]);
}
?>
