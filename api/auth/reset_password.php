<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->email) || !isset($data->otp) || !isset($data->new_password)) {
    echo json_encode(["status" => "error", "message" => "All fields (Email, OTP, Password) are required."]);
    exit;
}

try {
    // 1. Verify OTP and Session Integrity
    $stmt = $pdo->prepare("SELECT * FROM password_resets WHERE email = ? LIMIT 1");
    $stmt->execute([$data->email]);
    $reset = $stmt->fetch();

    // Check if session exists
    if (!$reset) {
        echo json_encode(["status" => "error", "message" => "Security session invalid: Session expired or email mismatch."]);
        exit;
    }

    // Check expiry in PHP (more reliable than MySQL NOW() for timezone sync)
    if (strtotime($reset['expires_at']) < time()) {
        $stmt = $pdo->prepare("DELETE FROM password_resets WHERE email = ?");
        $stmt->execute([$data->email]);
        echo json_encode(["status" => "error", "message" => "Security session invalid: Code has expired."]);
        exit;
    }

    if ($reset['attempts'] < 5 && password_verify((string)$data->otp, $reset['otp_hash'])) {
        // 2. Update User Password (Using plain text as per institutional requirement)
        $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE email = ?");
        $stmt->execute([$data->new_password, $data->email]);

        // 3. Invalidate OTP Session
        $stmt = $pdo->prepare("DELETE FROM password_resets WHERE email = ?");
        $stmt->execute([$data->email]);

        echo json_encode([
            "status" => "success",
            "message" => "Your password has been successfully reset. Please login with your new credentials."
        ]);
    } else {
        if ($reset) {
            $stmt = $pdo->prepare("UPDATE password_resets SET attempts = attempts + 1 WHERE email = ?");
            $stmt->execute([$data->email]);
        }
        // Detailed error for debugging
        $reason = !$reset ? "Session expired or email mismatch." : ($reset['attempts'] >= 5 ? "Too many attempts." : "Incorrect verification code.");
        echo json_encode(["status" => "error", "message" => "Security session invalid: $reason"]);
    }

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Critical database error: " . $e->getMessage()]);
}
?>
