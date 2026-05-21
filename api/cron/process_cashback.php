<?php
// api/cron/process_cashback.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

date_default_timezone_set('Asia/Kolkata');

// This script should be run daily via a Cron job.
// It processes the 1% daily cashback for active cycles.

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../models/Wallet.php';

$db = $pdo;
$db->exec("SET time_zone = '+05:30'");
$walletModel = new Wallet($db);

$logs = [];
$logs[] = "Initializing Yield Protocol at " . date('Y-m-d H:i:s');

// Clause 2.11: Exclude Saturdays and Sundays (DISABLED FOR TESTING/ADMIN MANUAL TRIGGER)
/*
$dayOfWeek = date('N'); // 1 (Mon) to 7 (Sun)
if ($dayOfWeek > 5) {
    echo json_encode([
        "status" => "success", 
        "message" => "Institutional protocol paused: Weekend detected.",
        "logs" => ["Weekend detected (" . date('l') . "). Skipping processing."]
    ]);
    exit;
}
*/

try {
    // Fetch dynamic platform settings
    $sStmt = $db->query("SELECT config_key, config_value FROM platform_settings");
    $settings = $sStmt->fetchAll(PDO::FETCH_KEY_PAIR);
    
    $cashbackRate = isset($settings['daily_cashback_rate']) ? (float)$settings['daily_cashback_rate'] / 100 : 0.01;
    $refCommRate = isset($settings['referral_commission']) ? (float)$settings['referral_commission'] / 100 : 0.05;

    $db->beginTransaction();

    // 1. Get all active cashback cycles that haven't been paid today
    $query = "SELECT * FROM cashback_cycles WHERE days_paid < 100 AND status = 'active' AND (last_paid_at IS NULL OR last_paid_at < CURDATE())";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $cycles = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $logs[] = "Processing " . count($cycles) . " active nodes...";

    // Helper to get total active investment for a user
    $getUserInvestment = function($uid) use ($db) {
        $st = $db->prepare("SELECT SUM(total_value) as sum_inv FROM cashback_cycles WHERE user_id = ? AND status = 'active'");
        $st->execute([$uid]);
        return (float)($st->fetch(PDO::FETCH_ASSOC)['sum_inv'] ?? 0);
    };

    // Commission Rates for 5 levels (Daily percentages)
    // Level 1: 0.2% (0.002), Level 2 & 3: 0.1% (0.001), Level 4 & 5: 0.05% (0.0005)
    $commRates = [
        1 => isset($settings['referral_commission_l1']) ? (float)$settings['referral_commission_l1'] / 100 : 0.002,
        2 => isset($settings['referral_commission_l2']) ? (float)$settings['referral_commission_l2'] / 100 : 0.001,
        3 => isset($settings['referral_commission_l3']) ? (float)$settings['referral_commission_l3'] / 100 : 0.001,
        4 => isset($settings['referral_commission_l4']) ? (float)$settings['referral_commission_l4'] / 100 : 0.0005,
        5 => isset($settings['referral_commission_l5']) ? (float)$settings['referral_commission_l5'] / 100 : 0.0005,
    ];

    foreach ($cycles as $cycle) {
        $userId = $cycle['user_id'];
        $totalValue = (float)$cycle['total_value'];
        $dailyCashback = $totalValue * $cashbackRate; 
        
        $newDaysCompleted = $cycle['days_paid'] + 1;
        $newTotalEarned = $cycle['paid_amount'] + $dailyCashback;
        
        $newStatus = ($newTotalEarned >= $totalValue || $newDaysCompleted >= 100) ? 'completed' : 'active';

        // Limit the cashback if it exceeds 100%
        if ($newTotalEarned > $totalValue) {
            $dailyCashback -= ($newTotalEarned - $totalValue);
            $newTotalEarned = $totalValue;
            $newStatus = 'completed';
        }

        if ($dailyCashback > 0) {
            // Update Cycle
            $updateStmt = $db->prepare("UPDATE cashback_cycles SET 
                days_paid = ?, 
                paid_amount = ?, 
                status = ?,
                last_paid_at = CURDATE()
                WHERE id = ?");
            $updateStmt->execute([$newDaysCompleted, $newTotalEarned, $newStatus, $cycle['id']]);

            // Credit User Wallet
            $walletModel->credit($userId, $dailyCashback, 'cashback', "Daily " . ($cashbackRate * 100) . "% cashback for Cycle #{$cycle['id']}");
            $logs[] = "Node #{$userId}: Cycle #{$cycle['id']} yielded ₹{$dailyCashback} (" . ($cashbackRate * 100) . "%)";
        }

        // Process Referral Commissions up the tree (5 Levels)
        $childInPath = $userId;
        $ancestor    = $userId;
        
        for ($level = 1; $level <= 5; $level++) {
            // Get referrer of the current ancestor
            $refStmt = $db->prepare("SELECT referrer_id FROM users WHERE id = ?");
            $refStmt->execute([$ancestor]);
            $referrerId = $refStmt->fetch(PDO::FETCH_ASSOC)['referrer_id'] ?? null;
            
            if (!$referrerId) break; // Root reached

            // --- 10 MEMBER LIMIT LOGIC ---
            // A referrer only earns from their first 10 direct referrals.
            // We check if $childInPath is among the first 10 people referred by $referrerId.
            $eligibilityStmt = $db->prepare("
                SELECT COUNT(*) 
                FROM users 
                WHERE referrer_id = ? AND created_at <= (SELECT created_at FROM users WHERE id = ?)
            ");
            $eligibilityStmt->execute([$referrerId, $childInPath]);
            $rank = (int)$eligibilityStmt->fetchColumn();

            if ($rank <= 10) {
                // Referrer is eligible for this specific line
                $commAmount = $totalValue * $commRates[$level];
                
                // Referrer must have an active investment to receive commission
                $referrerInvestment = $getUserInvestment($referrerId);

                if ($referrerInvestment > 0) {
                    // Credit to the referrer's oldest active cycle
                    $refCycleStmt = $db->prepare("SELECT * FROM cashback_cycles WHERE user_id = ? AND status = 'active' ORDER BY created_at ASC LIMIT 1");
                    $refCycleStmt->execute([$referrerId]);
                    $refCycle = $refCycleStmt->fetch(PDO::FETCH_ASSOC);

                    if ($refCycle) {
                        $refTotalValue = (float)$refCycle['total_value'];
                        $refTotalEarned = (float)$refCycle['paid_amount'];
                        
                        if ($refTotalEarned < $refTotalValue) {
                            $actualComm = $commAmount;
                            if (($refTotalEarned + $commAmount) > $refTotalValue) {
                                $actualComm = $refTotalValue - $refTotalEarned;
                            }

                            $newRefEarned = $refTotalEarned + $actualComm;
                            $newRefStatus = ($newRefEarned >= $refTotalValue) ? 'completed' : 'active';

                            $updateRefCycle = $db->prepare("UPDATE cashback_cycles SET paid_amount = ?, status = ? WHERE id = ?");
                            $updateRefCycle->execute([$newRefEarned, $newRefStatus, $refCycle['id']]);

                            $walletModel->credit($referrerId, $actualComm, 'referral', "Level {$level} Referral Commission from User #{$userId} (Line: User #{$childInPath})");
                            $logs[] = "   -> Referrer #{$referrerId} earned Level {$level} commission: ₹{$actualComm}";
                        }
                    }
                }
            } else {
                $logs[] = "   -> Referrer #{$referrerId} skip: User #{$childInPath} is outside the first 10 referral lines.";
            }
            
            // Move up the tree: the current referrer becomes the ancestor, 
            // and their parent will be the next referrer.
            $childInPath = $referrerId;
            $ancestor    = $referrerId;
        }
    }

    $db->commit();
    $logs[] = "Protocol finalized successfully at " . date('Y-m-d H:i:s');
    
    echo json_encode([
        "status" => "success",
        "message" => "Yield Protocol Completed Successfully.",
        "processed" => count($cycles),
        "logs" => $logs
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo json_encode([
        "status" => "error",
        "message" => "PROTOCOL_FAILURE: " . $e->getMessage(),
        "logs" => $logs
    ]);
}
?>
