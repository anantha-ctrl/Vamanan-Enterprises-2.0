<?php
// api/customer/get_profile.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../config.php';

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;

if (!$user_id) {
    die(json_encode(["status" => "error", "message" => "Unauthorized access"]));
}

try {
    $stmt = $pdo->prepare("SELECT id, name, email, phone, address, referral_code, role, created_at FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        // Also fetch KYC status if needed
        $kycStmt = $pdo->prepare("SELECT kyc_status, aadhar_no, pan_no FROM kyc_details WHERE user_id = ?");
        $kycStmt->execute([$user_id]);
        $kyc = $kycStmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            "status" => "success", 
            "data" => [
                "user" => $user,
                "kyc" => $kyc ? $kyc : ["kyc_status" => "none", "aadhar_no" => null, "pan_no" => null]
            ]
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "User not found"]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Fetch failed: " . $e->getMessage()]);
}
?>
