<?php
// api/customer/referrals.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config.php';
$db = $pdo;

$userId = $_GET['user_id'] ?? null;
if (!$userId) {
    echo json_encode(["status" => "error", "message" => "User ID required"]);
    exit;
}

try {
    // ── 1. User info + referral code ─────────────────────────────
    $uStmt = $db->prepare("SELECT name, referral_code FROM users WHERE id = ?");
    $uStmt->execute([$userId]);
    $userRow = $uStmt->fetch(PDO::FETCH_ASSOC);
    $referralCode = $userRow['referral_code'] ?? 'N/A';

    // ── 2. Commission rates per level from settings ──────────────
    $stmtSet = $db->query("SELECT config_key, config_value FROM platform_settings WHERE config_key LIKE 'referral_commission_l%'");
    $rates = $stmtSet->fetchAll(PDO::FETCH_KEY_PAIR);

    $commRates = [
        1 => ($rates['referral_commission_l1'] ?? '0.2') . '%',
        2 => ($rates['referral_commission_l2'] ?? '0.1') . '%',
        3 => ($rates['referral_commission_l3'] ?? '0.1') . '%',
        4 => ($rates['referral_commission_l4'] ?? '0.05') . '%',
        5 => ($rates['referral_commission_l5'] ?? '0.05') . '%',
    ];

    // ── 2b. Own daily cashback rate (for "YOU" node in the structure) ──
    $dcStmt = $db->prepare("SELECT config_value FROM platform_settings WHERE config_key = 'daily_cashback_rate'");
    $dcStmt->execute();
    $dailyCashbackRate = ($dcStmt->fetchColumn() ?: '1') . '%';

    // ── 3. Level-wise counts & actual earnings from transactions ──
    // We walk the tree BFS-style up to 5 levels
    $levels = [];
    $totalEarnings = 0;

    // Helper: get IDs at each level
    $currentLevelIds = [$userId];

    for ($lvl = 1; $lvl <= 5; $lvl++) {
        if (empty($currentLevelIds)) {
            $levels[] = ['level' => $lvl, 'count' => 0, 'commission' => $commRates[$lvl], 'earnings' => 0.0, 'users' => []];
            continue;
        }

        $placeholders = implode(',', array_fill(0, count($currentLevelIds), '?'));

        // Count + user list at this level
        $usersStmt = $db->prepare("SELECT id, name, created_at FROM users WHERE referrer_id IN ($placeholders)");
        $usersStmt->execute($currentLevelIds);
        $levelUsers = $usersStmt->fetchAll(PDO::FETCH_ASSOC);
        $count = count($levelUsers);
        $nextIds = array_column($levelUsers, 'id');

        // Earnings from transactions for THIS user from Level N referral commissions
        $earnStmt = $db->prepare("
            SELECT COALESCE(SUM(t.amount), 0) as earnings
            FROM transactions t
            JOIN wallets w ON t.wallet_id = w.id
            WHERE w.user_id = ? AND t.category = 'referral' AND t.description LIKE ?
        ");
        $earnStmt->execute([$userId, "%Level {$lvl} Referral Commission%"]);
        $earnings = (float) ($earnStmt->fetch(PDO::FETCH_ASSOC)['earnings'] ?? 0);

        $levels[] = [
            'level' => $lvl,
            'count' => $count,
            'commission' => $commRates[$lvl],
            'earnings' => $earnings,
            'users' => array_slice($levelUsers, 0, 10), // top 10 for display
        ];
        $totalEarnings += $earnings;

        // Descend
        $currentLevelIds = $nextIds;
    }

    // ── 4. Direct referrals (Level 1 full list) ──────────────────
    $directStmt = $db->prepare("
        SELECT u.id, u.name, u.created_at, u.kyc_status,
               COALESCE(SUM(c.total_value), 0) as invested
        FROM users u
        LEFT JOIN cashback_cycles c ON c.user_id = u.id AND c.status = 'active'
        WHERE u.referrer_id = ?
        GROUP BY u.id, u.name, u.created_at, u.kyc_status
        ORDER BY u.created_at DESC
    ");
    $directStmt->execute([$userId]);
    $directReferrals = $directStmt->fetchAll(PDO::FETCH_ASSOC);

    // ── 5. Eligibility check (REMOVED as per request - now automatic) ──
    $progress = count($directReferrals);
    $eligible = true; 

    // ── 6. Today's referral earnings ─────────────────────────────
    $todayStmt = $db->prepare("
        SELECT COALESCE(SUM(t.amount), 0) as today
        FROM transactions t
        JOIN wallets w ON t.wallet_id = w.id
        WHERE w.user_id = ? AND t.category = 'referral'
          AND DATE(t.created_at) = CURDATE()
    ");
    $todayStmt->execute([$userId]);
    $todayEarnings = (float) $todayStmt->fetch(PDO::FETCH_ASSOC)['today'];

    // ── 7. Referral transaction history ──────────────────────────
    $histStmt = $db->prepare("
        SELECT t.id, t.amount, t.description, t.created_at, t.status
        FROM transactions t
        JOIN wallets w ON t.wallet_id = w.id
        WHERE w.user_id = ? AND t.category = 'referral'
        ORDER BY t.created_at DESC
        LIMIT 30
    ");
    $histStmt->execute([$userId]);
    $history = $histStmt->fetchAll(PDO::FETCH_ASSOC);

    // ── 8. User's active investment ─────────────────────────────
    $invStmt = $db->prepare("SELECT COALESCE(SUM(total_value),0) as inv FROM cashback_cycles WHERE user_id = ? AND status = 'active'");
    $invStmt->execute([$userId]);
    $userInvestment = (float) $invStmt->fetch(PDO::FETCH_ASSOC)['inv'];

    echo json_encode([
        "status" => "success",
        "data" => [
            "referral_code" => $referralCode,
            "daily_cashback_rate" => $dailyCashbackRate,
            "levels" => $levels,
            "total_network_earnings" => $totalEarnings,
            "today_earnings" => $todayEarnings,
            "progress" => $progress,
            "eligible" => $eligible,
            "direct_referrals" => $directReferrals,
            "user_investment" => $userInvestment,
            "history" => $history,
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>