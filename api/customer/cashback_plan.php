<?php
// api/customer/cashback_plan.php
// Returns full cashback plan details for the logged-in customer
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

date_default_timezone_set('Asia/Kolkata');

try {
    require_once '../config/db.php';
    
    $database = new Database();
    $db       = $database->getConnection();

    $userId = $_GET['user_id'] ?? null;
    if (!$userId) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "user_id required"]);
        exit;
    }

    // 1. Fetch Cycles with new real-time columns
    $cStmt = $db->prepare("
        SELECT c.*
        FROM cashback_cycles c
        WHERE c.user_id = ?
        ORDER BY c.created_at DESC
    ");
    $cStmt->execute([$userId]);
    $cycles = $cStmt->fetchAll(PDO::FETCH_ASSOC);

    // ── AUTOMATIC PAYOUT TRIGGER (Lazy Processing) ───────────────────────────
    // This ensures that even if the admin hasn't run the cron, the user sees 
    // their latest earnings when they visit the page.
    $dayOfWeek = date('N'); // 1 (Mon) to 7 (Sun)
    $today     = date('Y-m-d');
    $payoutRun = false;

    if ($dayOfWeek <= 5) { // Weekdays only
        require_once '../models/Wallet.php';
        $walletModel = new Wallet($db);
        
        foreach ($cycles as &$cycle) {
            if ($cycle['status'] === 'active' && ($cycle['last_paid_at'] !== $today)) {
                // Process today's yield for this cycle
                $totalValue = (float)$cycle['total_value'];
                $dailyAmt   = (float)$cycle['daily_payout'];
                if ($dailyAmt <= 0) $dailyAmt = $totalValue * 0.01;

                $newDaysPaid = (int)$cycle['days_paid'] + 1;
                $newPaidAmt  = (float)$cycle['paid_amount'] + $dailyAmt;

                if ($newPaidAmt >= $totalValue) {
                    $dailyAmt   = $totalValue - (float)$cycle['paid_amount'];
                    $newPaidAmt = $totalValue;
                }

                $newStatus = ($newPaidAmt >= $totalValue || $newDaysPaid >= 100) ? 'completed' : 'active';

                if ($dailyAmt > 0) {
                    $db->prepare("UPDATE cashback_cycles SET days_paid = ?, paid_amount = ?, status = ?, last_paid_at = ? WHERE id = ?")
                       ->execute([$newDaysPaid, $newPaidAmt, $newStatus, $today, $cycle['id']]);
                    
                    $walletModel->credit($userId, $dailyAmt, 'cashback', "Daily 1% cashback — Day {$newDaysPaid} of 100 (Cycle #{$cycle['id']})");
                    
                    // Update the local array so the UI reflects it immediately
                    $cycle['days_paid']   = $newDaysPaid;
                    $cycle['paid_amount'] = $newPaidAmt;
                    $cycle['status']      = $newStatus;
                    $cycle['last_paid_at']= $today;
                    $payoutRun = true;
                }
            }
        }
    }
    // ─────────────────────────────────────────────────────────────────────────


    // 2. Aggregate stats
    $totalInvested    = 0;
    $totalEarned      = 0;
    $totalDailyPayout = 0;
    $activeCyclesCount = 0;
    $activeCycle      = null;

    foreach ($cycles as $cycle) {
        $totalInvested += (float)$cycle['total_value'];
        $totalEarned   += (float)($cycle['paid_amount'] ?? 0);

        if ($cycle['status'] === 'active' || $cycle['status'] === 'pending') {
            if ($cycle['status'] === 'active') {
                $totalDailyPayout += (float)($cycle['daily_payout'] ?? 0);
                $activeCyclesCount++;
            }
            if (!$activeCycle) {
                $activeCycle = $cycle;
            }
        }
    }

    // Current metrics
    $daysCompleted = $activeCycle ? (int)$activeCycle['days_paid'] : 0;
    $daysRemaining = 100 - $daysCompleted;
    $remainingValue = $activeCycle ? (float)$activeCycle['total_value'] - (float)$activeCycle['paid_amount'] : 0;
    $cashbackPct = $totalInvested > 0 ? round(($totalEarned / $totalInvested) * 100, 2) : 0;

    // 3. Transactions
    $tStmt = $db->prepare("
        SELECT t.*
        FROM transactions t
        JOIN wallets w ON t.wallet_id = w.id
        WHERE w.user_id = ? AND t.category IN ('cashback', 'referral', 'payout')
        ORDER BY t.created_at DESC
        LIMIT 50
    ");
    $tStmt->execute([$userId]);
    $transactions = $tStmt->fetchAll(PDO::FETCH_ASSOC);

    // 4. Today's Earning
    $today = date('Y-m-d');
    $todayEarned = 0;
    foreach($transactions as $tx) {
        // Match today's date and either 'cashback' or legacy 'payout' category
        if (strpos($tx['created_at'], $today) === 0 && ($tx['category'] === 'cashback' || $tx['category'] === 'payout')) {
            $todayEarned += (float)$tx['amount'];
        }
    }

    // 5. Referral Earned
    $referralEarned = 0;
    foreach($transactions as $tx) {
        if ($tx['category'] === 'referral') {
            $referralEarned += (float)$tx['amount'];
        }
    }

    // 5. Next Payout In calculation
    // Assuming payout is at 09:00 AM next weekday
    $now = new DateTime();
    $payoutTime = new DateTime('tomorrow 09:00:00');
    
    // If today is Friday, next payout is Monday
    if ($now->format('N') >= 5) {
        $payoutTime = new DateTime('next monday 09:00:00');
    } elseif ($now->format('H') < 9) {
        $payoutTime = new DateTime('today 09:00:00');
    }

    $diff = $now->diff($payoutTime);
    $nextPayoutStr = ($diff->days * 24 + $diff->h) . "h " . $diff->i . "m";
    $nextPayoutTs  = $payoutTime->getTimestamp() * 1000; // JavaScript timestamp (ms)

    echo json_encode([
        "status" => "success",
        "data"   => [
            "cycles"             => $cycles,
            "active_cycle"       => $activeCycle ? [
                "id"             => $activeCycle['id'],
                "total_value"    => (float)$activeCycle['total_value'],
                "daily_payout"   => (float)$activeCycle['daily_payout'],
                "total_earned"   => (float)$activeCycle['paid_amount'],
                "remaining_value"=> (float)$remainingValue,
                "days_completed" => $daysCompleted,
                "days_remaining" => $daysRemaining,
                "status"         => $activeCycle['status'],
                "asset_type"     => $activeCycle['asset_type'] ?? 'gold',
                "weight"         => (float)($activeCycle['weight'] ?? 0),
                "product_name"   => ($activeCycle['asset_type'] === 'silver' ? 'Pure Silver' : '22K Gold') . ' Asset',
                "cashback_pct"   => $cashbackPct,
            ] : null,
            "stats" => [
                "total_invested"     => (float)$totalInvested,
                "total_earned"       => (float)$totalEarned,
                "total_daily_payout" => (float)$totalDailyPayout,
                "active_cycles"      => $activeCyclesCount,
                "today_earned"       => (float)$todayEarned,
                "referral_earned"    => (float)$referralEarned,
                "next_payout_in"     => $nextPayoutStr,
                "next_payout_ts"     => $nextPayoutTs,
                "cashback_percentage"=> $cashbackPct
            ],
            "transactions" => $transactions
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "CASHBACK_ERR: " . $e->getMessage()]);
}
?>
