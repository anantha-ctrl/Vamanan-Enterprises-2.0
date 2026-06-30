<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->name) && !empty($data->email) && !empty($data->password) && !empty($data->phone)) {
    try {
        // 1. Check if user exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$data->email]);
        if($stmt->fetch()) {
            echo json_encode(["status" => "error", "message" => "This email is already registered."]);
            exit;
        }

        // 2. Store password as plain text (as requested)
        $hashed_password = $data->password;
        $referralCode = vevGenerateReferralCode($pdo);

        // Sequential VEV### customer ID (e.g. VEV001)
        $maxCust = (int)$pdo->query("SELECT COALESCE(MAX(CAST(SUBSTRING(customer_id, 4) AS UNSIGNED)), 0) FROM users WHERE customer_id LIKE 'VEV%'")->fetchColumn();
        $customerId = 'VEV' . str_pad($maxCust + 1, 3, '0', STR_PAD_LEFT);

        $pdo->beginTransaction();

        // 3. Find Referrer
        $referrerId = null;
        if(!empty($data->referral_code)) {
            $refStmt = $pdo->prepare("SELECT id FROM users WHERE referral_code = ?");
            $refStmt->execute([$data->referral_code]);
            if($refUser = $refStmt->fetch()) {
                $referrerId = $refUser['id'];
            }
        }

        // 4. Create User — force 'pending' so self-registered accounts cannot log in
        //    until an admin grants access (the `status` column default is 'active',
        //    so we must set it explicitly here rather than rely on the default).
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password, phone, customer_id, referral_code, referrer_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')");
        $stmt->execute([$data->name, $data->email, $hashed_password, $data->phone, $customerId, $referralCode, $referrerId]);
        $userId = $pdo->lastInsertId();

        // 5. Initialize Wallet
        $stmt = $pdo->prepare("INSERT INTO wallets (user_id, balance) VALUES (?, 0.00)");
        $stmt->execute([$userId]);

        $pdo->commit();

        echo json_encode([
            "status" => "success",
            "message" => "Registration successful! Your account is pending admin approval.",
            "user_id" => $userId
        ]);

    } catch (Exception $e) {
        if ($pdo->inTransaction()) { $pdo->rollBack(); }
        echo json_encode(["status" => "error", "message" => "Registration failed: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Please fill in all required fields."]);
}
?>
