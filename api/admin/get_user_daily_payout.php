<?php
// api/admin/get_user_daily_payout.php

// Suppress errors from breaking JSON, but log them if possible
error_reporting(0);
ini_set('display_errors', 0);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

try {
    require_once '../config/db.php';

    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        throw new Exception("Database connection failed");
    }

    $user_id = $_GET['user_id'] ?? null;

    if (!$user_id) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "user_id is required"]);
        exit;
    }

    // 1. Fetch Cycles
    $cStmt = $db->prepare("SELECT * FROM cashback_cycles WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC");
    $cStmt->execute([$user_id]);
    $cycles = $cStmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. Fetch Wallet
    $wStmt = $db->prepare("SELECT balance, total_earned, total_withdrawn FROM wallets WHERE user_id = ? LIMIT 1");
    $wStmt->execute([$user_id]);
    $wallet = $wStmt->fetch(PDO::FETCH_ASSOC);

    // 3. Totals
    $total_daily_payout   = 0;
    $total_invested       = 0;
    $total_earned_cycles  = 0;
    
    if ($cycles) {
        foreach($cycles as $c) {
            $total_daily_payout += (float)($c['daily_payout'] ?? 0);
            $total_invested     += (float)($c['total_value'] ?? 0);
            $total_earned_cycles += (float)($c['paid_amount'] ?? 0);
        }
    }

    $remaining_value = max(0, $total_invested - $total_earned_cycles);
    $cashback_pct = $total_invested > 0 ? round(($total_earned_cycles / $total_invested) * 100, 2) : 0;
    $days_completed = !empty($cycles) ? (int)($cycles[0]['days_paid'] ?? 0) : 0;

    echo json_encode([
        "status" => "success",
        "data"   => [
            "cycles"             => $cycles,
            "total_daily_payout" => (float)$total_daily_payout,
            "total_invested"     => (float)$total_invested,
            "total_earned"       => (float)$total_earned_cycles,
            "remaining_value"    => (float)$remaining_value,
            "cashback_percentage"=> (float)$cashback_pct,
            "days_completed"     => $days_completed,
            "active_cycles"      => count($cycles),
            "wallet_balance"     => (float)($wallet['balance'] ?? 0),
            "total_withdrawn"    => (float)($wallet['total_withdrawn'] ?? 0),
        ]
    ]);

} catch (Throwable $e) {
    // Return 200 with error status so Axios can read the message
    // http_response_code(200); 
    echo json_encode([
        "status" => "error", 
        "message" => "API Error: " . $e->getMessage(),
        "file" => basename($e->getFile()),
        "line" => $e->getLine()
    ]);
}
?>
