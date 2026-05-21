<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../config.php';

if (!isset($_GET['user_id'])) {
    echo json_encode(["status" => "error", "message" => "User ID required"]);
    exit;
}

$user_id = $_GET['user_id'];

try {
    // 1. Fetch User Basic Info
    $user_query = "SELECT id, name, email, phone, address, kyc_status, aadhar_no, pan_no, avatar, bank_name, account_no, ifsc_code FROM users WHERE id = :id";
    $user_stmt = $pdo->prepare($user_query);
    $user_stmt->bindParam(":id", $user_id);
    $user_stmt->execute();
    $user = $user_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(["status" => "error", "message" => "User not found"]);
        exit;
    }

    // 2. Fetch Wallet Balance
    $wallet_query = "SELECT balance FROM wallets WHERE user_id = :id";
    $wallet_stmt = $pdo->prepare($wallet_query);
    $wallet_stmt->bindParam(":id", $user_id);
    $wallet_stmt->execute();
    $wallet = $wallet_stmt->fetch(PDO::FETCH_ASSOC);

    // 3. Fetch Stats (Total Invested, Active Cycles)
    $stats_query = "SELECT 
                        (SELECT COUNT(*) FROM cashback_cycles WHERE user_id = :id AND status = 'active') as active_cycles,
                        (SELECT SUM(total_value) FROM cashback_cycles WHERE user_id = :id) as total_invested,
                        (SELECT COUNT(*) FROM users WHERE referrer_id = :id) as referral_count";
    $stats_stmt = $pdo->prepare($stats_query);
    $stats_stmt->bindParam(":id", $user_id);
    $stats_stmt->execute();
    $stats = $stats_stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => [
            "user" => $user,
            "wallet" => $wallet ?: ["balance" => 0],
            "stats" => [
                "active_cycles" => $stats['active_cycles'] ?: 0,
                "total_invested" => $stats['total_invested'] ?: 0,
                "referral_count" => $stats['referral_count'] ?: 0
            ]
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
