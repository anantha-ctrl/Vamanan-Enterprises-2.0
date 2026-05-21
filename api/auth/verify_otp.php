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
    $stmt = $pdo->prepare("SELECT * FROM password_resets WHERE email = ? LIMIT 1");
    $stmt->execute([$data->email]);
    $reset = $stmt->fetch();

    if (!$reset) {
        echo json_encode(["status" => "error", "message" => "Security session expired. Please request a new code."]);
        exit;
    }

    // Check expiry
    if (strtotime($reset['expires_at']) < time()) {
        $stmt = $pdo->prepare("DELETE FROM password_resets WHERE email = ?");
        $stmt->execute([$data->email]);
        echo json_encode(["status" => "error", "message" => "The code has expired. Please request a new one."]);
        exit;
    }

    // Check attempt limits (max 5 attempts)
    if ($reset['attempts'] >= 5) {
        echo json_encode(["status" => "error", "message" => "Too many failed attempts. Your reset session has been locked for security."]);
        exit;
    }

    // Verify OTP Hash
    if (password_verify((string)$data->otp, $reset['otp_hash'])) {
        echo json_encode([
            "status" => "success",
            "message" => "Identity verified. You can now set your new password."
        ]);
    } else {
        // Increment attempts
        $stmt = $pdo->prepare("UPDATE password_resets SET attempts = attempts + 1 WHERE email = ?");
        $stmt->execute([$data->email]);
        
        $remaining = 4 - $reset['attempts'];
        echo json_encode(["status" => "error", "message" => "Incorrect code. $remaining attempts remaining."]);
    }

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "System error occurred: " . $e->getMessage()]);
}
?>
