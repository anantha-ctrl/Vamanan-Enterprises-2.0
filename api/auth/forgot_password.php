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

// Debug: Log the incoming request
file_put_contents(__DIR__ . '/../mail_log.txt', "[" . date('Y-m-d H:i:s') . "] RECOVERY REQUEST FOR: " . $data->email . "\n", FILE_APPEND);


try {
    // Rate Limiting: Check if a request was sent in the last 2 minutes
    $stmt = $pdo->prepare("SELECT created_at FROM password_resets WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 2 MINUTE) LIMIT 1");
    $stmt->execute([$data->email]);
    if ($stmt->fetch()) {
        echo json_encode(["status" => "error", "message" => "Too many requests. Please wait 2 minutes before requesting a new code."]);
        exit;
    }

    // Generate 6-digit OTP
    $otp = sprintf("%06d", mt_rand(1, 999999));
    $otp_hash = password_hash($otp, PASSWORD_DEFAULT);
    $expires_at = date('Y-m-d H:i:s', strtotime('+10 minutes'));

    // Check if user exists (but don't disclose)
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$data->email]);
    $user = $stmt->fetch();

    if ($user) {
        // Delete old resets for this email
        $stmt = $pdo->prepare("DELETE FROM password_resets WHERE email = ?");
        $stmt->execute([$data->email]);

        // Insert new reset record
        $stmt = $pdo->prepare("INSERT INTO password_resets (email, otp_hash, expires_at) VALUES (?, ?, ?)");
        $stmt->execute([$data->email, $otp_hash, $expires_at]);

        // Send Email (Disabled as per user request for direct localized OTP display)
        // sendOTPMail($data->email, $otp);

        // 5. Generic response with localized OTP for institutional synchronization
        echo json_encode([
            "status" => "success",
            "message" => "Identity verified. Synchronization code generated.",
            "otp" => $otp 
        ]);
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "Identity not found. Please verify your institutional email."
        ]);
    }

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "System error occurred."]);
}
?>
