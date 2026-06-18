<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require_once '../config.php';

try {
    // 1. Total Investors
    $stmt = $pdo->query("SELECT COUNT(id) as total FROM users WHERE role = 'customer'");
    $investors = (int) ($stmt->fetch()['total'] ?? 0);

    // 2. Total Gold Value (Sum of all cycles value)
    $stmt = $pdo->query("SELECT SUM(total_value) as total FROM cashback_cycles");
    $goldVal = (float) ($stmt->fetch()['total'] ?? 0);

    // 3. Daily Payouts (Sum of today's credits)
    $stmt = $pdo->query("SELECT SUM(amount) as total FROM transactions WHERE type = 'credit' AND category IN ('cashback', 'referral') AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
    $weeklyPay = (float) ($stmt->fetch()['total'] ?? 0);

    // 4. Platform Metrics & Multipliers (From settings)
    $sStmt = $pdo->query("SELECT config_key, config_value FROM platform_settings");
    $settings = $sStmt->fetchAll(PDO::FETCH_KEY_PAIR);

    $goldRate = $settings['gold_rate_24k'] ?? 0;
    $investorOffset = (int) ($settings['marketing_investor_offset'] ?? 1200);
    $capitalOffset = (float) ($settings['marketing_capital_offset'] ?? 150000000);
    $payoutOffset = (float) ($settings['marketing_payout_offset'] ?? 450000);

    echo json_encode([
        "status" => "success",
        "data" => [
            "investors" => number_format($investors + $investorOffset) . "+",
            "goldValue" => "₹" . round(($goldVal + $capitalOffset) / 10000000, 1) . "Cr+",
            "dailyPayouts" => "₹" . round(($weeklyPay + $payoutOffset) / 100000, 1) . "L+",
            "currentGoldRate" => $goldRate
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>