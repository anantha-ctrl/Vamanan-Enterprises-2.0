<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../config.php';
require_once '../mail_helper.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$data = json_decode(file_get_contents("php://input"));

if (empty($data->email)) {
    echo json_encode(["status" => "error", "message" => "Email is required."]);
    exit;
}

try {
    // 1. Verify User exists and is active
    $stmt = $pdo->prepare("SELECT status FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$data->email]);
    $user = $stmt->fetch();

    if (!$user) {
        echo json_encode(["status" => "error", "message" => "Account not found."]);
        exit;
    }

    if ($user['status'] === 'pending') {
        echo json_encode(["status" => "error", "message" => "Your account is pending admin approval."]);
        exit;
    }
    if ($user['status'] === 'suspended') {
        echo json_encode(["status" => "error", "message" => "Your account has been suspended."]);
        exit;
    }

    // 2. Rate Limiting: Check if a code was created in the last 60 seconds
    $stmt = $pdo->prepare("SELECT created_at FROM login_otps WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE) LIMIT 1");
    $stmt->execute([$data->email]);
    if ($stmt->fetch()) {
        echo json_encode(["status" => "error", "message" => "Rate limit exceeded. Please wait 60 seconds before requesting a new code."]);
        exit;
    }

    // 3. Generate 6-digit OTP
    $otp = sprintf("%06d", mt_rand(100000, 999999));
    $otp_hash = password_hash($otp, PASSWORD_DEFAULT);
    $expires_at = date('Y-m-d H:i:s', strtotime('+10 minutes'));

    // 4. Invalidate old sessions and insert new one
    $stmt = $pdo->prepare("DELETE FROM login_otps WHERE email = ?");
    $stmt->execute([$data->email]);

    $stmt = $pdo->prepare("INSERT INTO login_otps (email, otp_hash, expires_at) VALUES (?, ?, ?)");
    $stmt->execute([$data->email, $otp_hash, $expires_at]);

    // 5. Send secure login OTP email
    sendLoginOTPMail($data->email, $otp);

    echo json_encode([
        "status" => "success",
        "message" => "A new secure verification code has been dispatched."
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database failure: " . $e->getMessage()]);
}
?>
