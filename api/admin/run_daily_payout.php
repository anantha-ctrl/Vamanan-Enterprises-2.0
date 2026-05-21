<?php
// api/admin/run_daily_payout.php
// Manual trigger for the daily cashback payout — callable from Admin Dashboard
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

date_default_timezone_set('Asia/Kolkata');

require_once '../config/db.php';
require_once '../models/Wallet.php';

$database = new Database();
$db       = $database->getConnection();
$db->exec("SET time_zone = '+05:30'");
$wallet   = new Wallet($db);

$processed  = [];
$errors     = [];
$totalPaid  = 0;
$closed     = [];

try {
    $db->beginTransaction();

    // 1. Fetch all active cycles
    $stmt = $db->prepare("SELECT * FROM cashback_cycles WHERE status = 'active' AND days_paid < 100");
    $stmt->execute();
    $cycles = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($cycles as $cycle) {
        $userId     = $cycle['user_id'];
        $totalValue = (float)$cycle['total_value'];
        $dailyAmt   = (float)$cycle['daily_payout'];  // already stored as 1% of total_value

        // Fallback if daily_payout is 0
        if ($dailyAmt <= 0) $dailyAmt = $totalValue * 0.01;

        $newDaysCompleted = (int)$cycle['days_paid'] + 1;
        $newTotalEarned   = (float)$cycle['paid_amount'] + $dailyAmt;

        // Cap at 100% (total_value)
        if ($newTotalEarned >= $totalValue) {
            $dailyAmt       = $totalValue - (float)$cycle['paid_amount'];
            $newTotalEarned = $totalValue;
        }

        $newStatus = ($newTotalEarned >= $totalValue || $newDaysCompleted >= 100) ? 'completed' : 'active';

        if ($dailyAmt > 0) {
            // Update cycle
            $db->prepare("UPDATE cashback_cycles SET days_paid = ?, paid_amount = ?, status = ?, last_paid_at = CURDATE() WHERE id = ?")
               ->execute([$newDaysCompleted, $newTotalEarned, $newStatus, $cycle['id']]);

            // Credit wallet
            $wallet->credit($userId, $dailyAmt, 'cashback', "Daily 1% cashback — Day {$newDaysCompleted} of 100 (Cycle #{$cycle['id']})");

            $totalPaid += $dailyAmt;
            $processed[] = [
                'user_id'   => $userId,
                'cycle_id'  => $cycle['id'],
                'paid'      => $dailyAmt,
                'day'       => $newDaysCompleted,
                'status'    => $newStatus
            ];

            if ($newStatus === 'completed') {
                $closed[] = "Cycle #{$cycle['id']} for User #{$userId} — 100% complete, cycle closed.";
            }
        }

        // ── Referral Commissions (5 Levels) ────────────────────────────────
        $commRates  = [1 => 0.002, 2 => 0.001, 3 => 0.001, 4 => 0.0005, 5 => 0.0005];
        $currentUid = $userId;

        for ($lvl = 1; $lvl <= 5; $lvl++) {
            $rStmt = $db->prepare("SELECT referrer_id FROM users WHERE id = ?");
            $rStmt->execute([$currentUid]);
            $referrerId = $rStmt->fetch(PDO::FETCH_ASSOC)['referrer_id'] ?? null;
            if (!$referrerId) break;

            // Check referrer has an active cycle that hasn't hit 100% cap
            $rcStmt = $db->prepare("SELECT * FROM cashback_cycles WHERE user_id = ? AND status = 'active' ORDER BY created_at ASC LIMIT 1");
            $rcStmt->execute([$referrerId]);
            $refCycle = $rcStmt->fetch(PDO::FETCH_ASSOC);

            if ($refCycle) {
                $refCapRemaining = (float)$refCycle['total_value'] - (float)$refCycle['paid_amount'];
                if ($refCapRemaining > 0) {
                    $commAmt = min($totalValue * $commRates[$lvl], $refCapRemaining);

                    $newRefEarned = (float)$refCycle['paid_amount'] + $commAmt;
                    $refNewStatus = ($newRefEarned >= (float)$refCycle['total_value']) ? 'completed' : 'active';

                    $db->prepare("UPDATE cashback_cycles SET paid_amount = ?, status = ? WHERE id = ?")
                       ->execute([$newRefEarned, $refNewStatus, $refCycle['id']]);

                    $wallet->credit($referrerId, $commAmt, 'referral', "Level {$lvl} referral commission from User #{$userId}");

                    if ($refNewStatus === 'completed') {
                        $closed[] = "Referrer #{$referrerId} Cycle #{$refCycle['id']} hit 100% cap — closed.";
                    }
                }
            }

            $currentUid = $referrerId;
        }
    }

    $db->commit();

    echo json_encode([
        "status"          => "success",
        "message"         => count($processed) . " cycles processed. Total paid: ₹" . number_format($totalPaid, 2),
        "processed_count" => count($processed),
        "total_paid"      => $totalPaid,
        "cycles_closed"   => $closed,
        "details"         => $processed
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
