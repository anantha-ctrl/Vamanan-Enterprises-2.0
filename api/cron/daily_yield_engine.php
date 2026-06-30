<?php
// api/cron/daily_yield_engine.php
//
// Reusable "1% Diurnal Yield" engine — credits each customer's daily cashback
// (on the GST-excluded product value) plus 5-level referral commissions.
//
// Two entry points:
//   run_daily_yield($db)        → process today's payout for every active cycle.
//                                 Idempotent per day: each cycle carries
//                                 last_paid_at, and only cycles with
//                                 last_paid_at < CURDATE() are picked up, so a
//                                 second run on the same day is a no-op.
//   maybe_run_daily_yield($db)  → "lazy cron": runs run_daily_yield() at most
//                                 once per calendar day, claimed atomically via
//                                 platform_settings.last_yield_run so concurrent
//                                 web requests can't double-trigger it. Safe to
//                                 call from any high-traffic endpoint; never
//                                 throws (failures are swallowed so the host
//                                 request is unaffected).

require_once __DIR__ . '/../models/Wallet.php';

if (!function_exists('run_daily_yield')) {
    function run_daily_yield(PDO $db): array {
        date_default_timezone_set('Asia/Kolkata');
        $db->exec("SET time_zone = '+05:30'");
        $walletModel = new Wallet($db);

        $logs = [];
        $logs[] = "Initializing Yield Protocol at " . date('Y-m-d H:i:s');

        // Dynamic platform settings (rates are admin-configurable).
        $settings = [];
        try {
            $settings = $db->query("SELECT config_key, config_value FROM platform_settings")->fetchAll(PDO::FETCH_KEY_PAIR);
        } catch (Throwable $e) { /* table may not exist yet — fall back to defaults */ }

        $cashbackRate = isset($settings['daily_cashback_rate']) ? (float)$settings['daily_cashback_rate'] / 100 : 0.01;

        $commRates = [
            1 => isset($settings['referral_commission_l1']) ? (float)$settings['referral_commission_l1'] / 100 : 0.002,
            2 => isset($settings['referral_commission_l2']) ? (float)$settings['referral_commission_l2'] / 100 : 0.001,
            3 => isset($settings['referral_commission_l3']) ? (float)$settings['referral_commission_l3'] / 100 : 0.001,
            4 => isset($settings['referral_commission_l4']) ? (float)$settings['referral_commission_l4'] / 100 : 0.0005,
            5 => isset($settings['referral_commission_l5']) ? (float)$settings['referral_commission_l5'] / 100 : 0.0005,
        ];

        $getUserInvestment = function ($uid) use ($db) {
            $st = $db->prepare("SELECT SUM(total_value) AS sum_inv FROM cashback_cycles WHERE user_id = ? AND status = 'active'");
            $st->execute([$uid]);
            return (float)($st->fetch(PDO::FETCH_ASSOC)['sum_inv'] ?? 0);
        };

        $db->beginTransaction();
        try {
            // Active cycles not yet paid today.
            $stmt = $db->prepare("SELECT * FROM cashback_cycles
                                  WHERE days_paid < 100 AND status = 'active'
                                  AND (last_paid_at IS NULL OR last_paid_at < CURDATE())");
            $stmt->execute();
            $cycles = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $logs[] = "Processing " . count($cycles) . " active nodes...";

            foreach ($cycles as $cycle) {
                $userId = $cycle['user_id'];
                // GST-exclusive: cashback is computed on the product subtotal only.
                $eligible = (float)($cycle['cashback_eligible_amount'] ?? 0);
                if ($eligible <= 0) $eligible = (float)$cycle['total_value']; // legacy rows (GST was 0)
                $dailyCashback = $eligible * $cashbackRate;

                $newDaysCompleted = $cycle['days_paid'] + 1;
                $newTotalEarned   = $cycle['paid_amount'] + $dailyCashback;
                $newStatus = ($newTotalEarned >= $eligible || $newDaysCompleted >= 100) ? 'completed' : 'active';

                // Cap cashback at 100% of the GST-excluded base.
                if ($newTotalEarned > $eligible) {
                    $dailyCashback -= ($newTotalEarned - $eligible);
                    $newTotalEarned = $eligible;
                    $newStatus = 'completed';
                }

                if ($dailyCashback > 0) {
                    $db->prepare("UPDATE cashback_cycles SET days_paid = ?, paid_amount = ?, status = ?, last_paid_at = CURDATE() WHERE id = ?")
                       ->execute([$newDaysCompleted, $newTotalEarned, $newStatus, $cycle['id']]);
                    $walletModel->credit($userId, $dailyCashback, 'cashback', "Daily " . ($cashbackRate * 100) . "% cashback on ₹" . number_format($eligible, 2) . " product value (excl. GST) — Cycle #{$cycle['id']}");
                    $logs[] = "Node #{$userId}: Cycle #{$cycle['id']} yielded ₹{$dailyCashback}";
                }

                // Referral commissions up the tree (5 levels), first-10-lines limit.
                $childInPath = $userId;
                $ancestor    = $userId;
                for ($level = 1; $level <= 5; $level++) {
                    $refStmt = $db->prepare("SELECT referrer_id FROM users WHERE id = ?");
                    $refStmt->execute([$ancestor]);
                    $referrerId = $refStmt->fetch(PDO::FETCH_ASSOC)['referrer_id'] ?? null;
                    if (!$referrerId) break;

                    // Referrer earns only from their first 10 direct referral lines.
                    $eligibilityStmt = $db->prepare("SELECT COUNT(*) FROM users WHERE referrer_id = ? AND created_at <= (SELECT created_at FROM users WHERE id = ?)");
                    $eligibilityStmt->execute([$referrerId, $childInPath]);
                    $rank = (int)$eligibilityStmt->fetchColumn();

                    if ($rank <= 10) {
                        $commAmount = $eligible * $commRates[$level];
                        if ($getUserInvestment($referrerId) > 0) {
                            $refCycleStmt = $db->prepare("SELECT * FROM cashback_cycles WHERE user_id = ? AND status = 'active' ORDER BY created_at ASC LIMIT 1");
                            $refCycleStmt->execute([$referrerId]);
                            $refCycle = $refCycleStmt->fetch(PDO::FETCH_ASSOC);
                            if ($refCycle) {
                                $refTotalValue = (float)($refCycle['cashback_eligible_amount'] ?? 0);
                                if ($refTotalValue <= 0) $refTotalValue = (float)$refCycle['total_value'];
                                $refTotalEarned = (float)$refCycle['paid_amount'];
                                if ($refTotalEarned < $refTotalValue) {
                                    $actualComm = $commAmount;
                                    if (($refTotalEarned + $commAmount) > $refTotalValue) {
                                        $actualComm = $refTotalValue - $refTotalEarned;
                                    }
                                    $newRefEarned = $refTotalEarned + $actualComm;
                                    $newRefStatus = ($newRefEarned >= $refTotalValue) ? 'completed' : 'active';
                                    $db->prepare("UPDATE cashback_cycles SET paid_amount = ?, status = ? WHERE id = ?")
                                       ->execute([$newRefEarned, $newRefStatus, $refCycle['id']]);
                                    $walletModel->credit($referrerId, $actualComm, 'referral', "Level {$level} Referral Commission from User #{$userId} (Line: User #{$childInPath})");
                                    $logs[] = "   -> Referrer #{$referrerId} earned Level {$level} commission: ₹{$actualComm}";
                                }
                            }
                        }
                    }
                    $childInPath = $referrerId;
                    $ancestor    = $referrerId;
                }
            }

            $db->commit();
            $logs[] = "Protocol finalized successfully at " . date('Y-m-d H:i:s');
            return ["status" => "success", "message" => "Yield Protocol Completed Successfully.", "processed" => count($cycles), "logs" => $logs];
        } catch (Throwable $e) {
            if ($db->inTransaction()) $db->rollBack();
            $logs[] = "PROTOCOL_FAILURE: " . $e->getMessage();
            return ["status" => "error", "message" => "PROTOCOL_FAILURE: " . $e->getMessage(), "logs" => $logs];
        }
    }
}

if (!function_exists('maybe_run_daily_yield')) {
    function maybe_run_daily_yield(PDO $db): ?array {
        try {
            // Guard store (shares the platform_settings table).
            $db->exec("CREATE TABLE IF NOT EXISTS platform_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                config_key VARCHAR(100) UNIQUE NOT NULL,
                config_value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )");
            $db->exec("INSERT IGNORE INTO platform_settings (config_key, config_value) VALUES ('last_yield_run', NULL)");

            // Atomically claim today's run — only one concurrent request wins.
            $claim = $db->prepare("UPDATE platform_settings SET config_value = CURDATE()
                                   WHERE config_key = 'last_yield_run'
                                   AND (config_value IS NULL OR config_value = '' OR config_value < CURDATE())");
            $claim->execute();
            if ($claim->rowCount() !== 1) {
                return null; // already ran (or claimed) today
            }

            $result = run_daily_yield($db);

            // If the engine failed, release the claim so a later request can retry today.
            if (($result['status'] ?? '') !== 'success') {
                $db->prepare("UPDATE platform_settings SET config_value = NULL WHERE config_key = 'last_yield_run'")->execute();
            }
            return $result;
        } catch (Throwable $e) {
            // Never let the lazy trigger break the host request.
            try {
                if ($db->inTransaction()) $db->rollBack();
                $db->prepare("UPDATE platform_settings SET config_value = NULL WHERE config_key = 'last_yield_run'")->execute();
            } catch (Throwable $ignored) {}
            return null;
        }
    }
}
?>
