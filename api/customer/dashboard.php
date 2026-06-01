<?php
// api/customer/dashboard.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../models/Wallet.php';
$db = $pdo;
$walletModel = new Wallet($db);

$userId = isset($_GET['user_id']) ? $_GET['user_id'] : null;

if(!$userId) {
    echo json_encode(["status" => "error", "message" => "User ID required"]);
    exit;
}

try {
    // 1. Fetch User Info
    $uStmt = $db->prepare("SELECT name, email, kyc_status, referral_code FROM users WHERE id = ?");
    $uStmt->execute([$userId]);
    $user = $uStmt->fetch(PDO::FETCH_ASSOC);

    // 2. Wallet Balance & Transactions
    $balanceData = $walletModel->getBalance($userId);
    $transactions = $walletModel->getTransactions($userId);

    // 3. Cashback Cycles — fetch with real-time asset data
    $cStmt = $db->prepare("SELECT * FROM cashback_cycles WHERE user_id = ? ORDER BY created_at DESC");
    $cStmt->execute([$userId]);
    $cycles = $cStmt->fetchAll(PDO::FETCH_ASSOC);

    $totalInvestment    = 0;
    $totalEarned        = 0;
    $totalDailyPayout   = 0;
    $activeCyclesCount  = 0;
    $daysCompleted      = 0;
    $daysRemaining      = 100;
    $activeCycle        = null;

    foreach ($cycles as $cycle) {
        if ($cycle['status'] === 'active' || $cycle['status'] === 'pending') {
            $totalInvestment   += (float)$cycle['total_value'];
            $totalEarned       += (float)($cycle['paid_amount'] ?? 0);
            
            if ($cycle['status'] === 'active') {
                $totalDailyPayout  += (float)($cycle['daily_payout'] ?? 0);
                $activeCyclesCount++;
            }

            if (!$activeCycle) {
                $activeCycle   = $cycle;
                $daysCompleted = (int)($cycle['days_paid'] ?? 0);
                $daysRemaining = 100 - $daysCompleted;
            }
        } elseif ($cycle['status'] === 'completed') {
            $totalInvestment += (float)$cycle['total_value'];
            $totalEarned     += (float)($cycle['paid_amount'] ?? 0);
        }
    }

    if (!$activeCycle && count($cycles) > 0) {
        $activeCycle   = $cycles[0];
        $daysCompleted = (int)($activeCycle['days_paid'] ?? 0);
        $daysRemaining = 100 - $daysCompleted;
    }

    // Daily rate from active cycle (default 1%)
    $dailyRate = $activeCycle ? round((float)($activeCycle['daily_payout'] ?? 0) / max((float)($activeCycle['total_value'] ?? 1), 1) * 100, 2) : 1;

    // 4. Referral Stats (Total 5-Level Network)
    function countNetwork($db, $parentId, $level = 1) {
        if ($level > 5) return 0;
        $stmt = $db->prepare("SELECT id FROM users WHERE referrer_id = ?");
        $stmt->execute([$parentId]);
        $ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $count = count($ids);
        foreach ($ids as $id) {
            $count += countNetwork($db, $id, $level + 1);
        }
        return $count;
    }
    $referralCount = countNetwork($db, $userId);

    // 5. Active Agreement
    $aStmt = $db->prepare("SELECT id FROM agreements WHERE user_id = ? ORDER BY created_at DESC LIMIT 1");
    $aStmt->execute([$userId]);
    $agreement = $aStmt->fetch(PDO::FETCH_ASSOC);

    // 6. Notifications
    $nStmt = $db->prepare("SELECT title, message, created_at FROM notifications WHERE user_id IS NULL OR user_id = ? ORDER BY created_at DESC LIMIT 5");
    $nStmt->execute([$userId]);
    $notifications = $nStmt->fetchAll(PDO::FETCH_ASSOC);

    // 7. Today's Earning (Daily Cashback)
    $today = date('Y-m-d');
    $todayEarning = 0;
    $totalReferralEarnings = 0;

    foreach($transactions as $tx) {
        if (isset($tx['category']) && $tx['category'] === 'cashback' && strpos($tx['created_at'], $today) === 0) {
            $todayEarning += (float)$tx['amount'];
        }
        if (isset($tx['category']) && $tx['category'] === 'referral') {
            $totalReferralEarnings += (float)$tx['amount'];
        }
    }

    echo json_encode([
        "status" => "success",
        "data" => [
            "user"              => $user,
            "balance"           => $balanceData['balance'] ?? 0.00,
            "cycles"            => $cycles,
            "active_cycle"      => [
                "total_value"        => $totalInvestment,
                "total_earned"       => $totalEarned,
                "remaining_value"    => max(0, $totalInvestment - $totalEarned),
                "cashback_percentage"=> $totalInvestment > 0 ? round(($totalEarned / $totalInvestment) * 100, 2) : 0,
                "is_closing_soon"    => $daysRemaining <= 10 && $daysRemaining > 0,
                "days_completed"     => $daysCompleted,
                "days_remaining"     => $daysRemaining,
                "daily_payout"       => $totalDailyPayout,
                "daily_rate"         => $dailyRate,
                "active_plans_count" => $activeCyclesCount,
                "status"             => $activeCycle ? $activeCycle['status'] : 'none',
                "asset_type"         => $activeCycle['asset_type'] ?? 'gold',
                "weight"             => (float)($activeCycle['weight'] ?? 0),
                "product_name"       => $activeCycle
                    ? (!empty($activeCycle['product_name'])
                        ? $activeCycle['product_name']
                        : ($activeCycle['asset_type'] === 'silver' ? 'Pure Silver Asset' : '22K Gold Asset'))
                    : 'Investment Portfolio',
                "today_earning"      => $todayEarning,
                "total_referral_earned" => $totalReferralEarnings,
            ],
            "transactions"      => $transactions,
            "referrals_count"   => $referralCount,
            "referral_code"     => $user['referral_code'] ?? null,
            "agreement_id"      => $agreement['id'] ?? null,
            "notifications"     => $notifications
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
