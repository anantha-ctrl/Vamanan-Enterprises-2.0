<?php
// api/customer/dashboard.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../models/Wallet.php';
require_once __DIR__ . '/../cron/daily_yield_engine.php';
$db = $pdo;
$walletModel = new Wallet($db);

// Lazy daily cron: auto-credit today's cashback (once per day, for everyone)
// when a customer opens their dashboard. Never throws.
maybe_run_daily_yield($db);

$userId = isset($_GET['user_id']) ? $_GET['user_id'] : null;

if(!$userId) {
    echo json_encode(["status" => "error", "message" => "User ID required"]);
    exit;
}

try {
    // 1. Fetch User Info
    $uStmt = $db->prepare("SELECT name, email, kyc_status, customer_id, referral_code FROM users WHERE id = ?");
    $uStmt->execute([$userId]);
    $user = $uStmt->fetch(PDO::FETCH_ASSOC);

    // 2. Wallet Balance & Transactions
    $balanceData = $walletModel->getBalance($userId);
    $transactions = $walletModel->getTransactions($userId);

    // 3. Cashback Cycles — fetch with real-time asset data
    $cStmt = $db->prepare("SELECT * FROM cashback_cycles WHERE user_id = ? ORDER BY created_at DESC");
    $cStmt->execute([$userId]);
    $cycles = $cStmt->fetchAll(PDO::FETCH_ASSOC);

    $totalInvestment    = 0;   // total paid (incl. GST)
    $totalEligible      = 0;   // GST-excluded product value — the cashback base
    $totalGst           = 0;
    $totalEarned        = 0;
    $totalDailyPayout   = 0;
    $activeCyclesCount  = 0;
    $daysCompleted      = 0;
    $daysRemaining      = 100;
    $activeCycle        = null;

    foreach ($cycles as $cycle) {
        if (in_array($cycle['status'], ['active', 'pending', 'completed'], true)) {
            // GST-exclusive: cashback progress is measured against the product subtotal, not the GST-inclusive total.
            $eligible = (float)($cycle['cashback_eligible_amount'] ?? 0);
            if ($eligible <= 0) $eligible = (float)$cycle['total_value']; // legacy rows (GST was 0)

            $totalInvestment += (float)$cycle['total_value'];
            $totalEligible   += $eligible;
            $totalGst        += (float)($cycle['gst_amount'] ?? 0);
            $totalEarned     += (float)($cycle['paid_amount'] ?? 0);

            if ($cycle['status'] === 'active') {
                $totalDailyPayout += (float)($cycle['daily_payout'] ?? 0);
                $activeCyclesCount++;
            }

            if (!$activeCycle && $cycle['status'] !== 'completed') {
                $activeCycle   = $cycle;
                $daysCompleted = (int)($cycle['days_paid'] ?? 0);
                $daysRemaining = 100 - $daysCompleted;
            }
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
                "product_amount"     => $totalEligible,
                "gst_amount"         => $totalGst,
                "cashback_eligible"  => $totalEligible,
                "total_earned"       => $totalEarned,
                "remaining_value"    => max(0, $totalEligible - $totalEarned),
                "cashback_percentage"=> $totalEligible > 0 ? round(($totalEarned / $totalEligible) * 100, 2) : 0,
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
            "customer_id"       => $user['customer_id'] ?? null,
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
