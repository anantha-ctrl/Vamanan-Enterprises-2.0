<?php
// api/advocate/actions.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once '../config/db.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->action) || !isset($data->id)) {
    echo json_encode(["status" => "error", "message" => "Invalid data"]);
    exit;
}

try {
    switch ($data->action) {
        case 'approve_agreement':
            $stmt = $db->prepare("UPDATE agreements SET status = 'ratified', signed_at = CURRENT_TIMESTAMP WHERE id = ?");
            $stmt->execute([$data->id]);
            
            // Log Activity
            $logStmt = $db->prepare("INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)");
            $logStmt->execute([0, 'legal_approval', "Agreement #{$data->id} approved by Advocate"]);

            echo json_encode(["status" => "success", "message" => "Agreement Approved"]);
            break;

        case 'reject_agreement':
            $stmt = $db->prepare("UPDATE agreements SET status = 'rejected' WHERE id = ?");
            $stmt->execute([$data->id]);
            echo json_encode(["status" => "success", "message" => "Agreement Rejected"]);
            break;

        case 'resolve_dispute':
            $stmt = $db->prepare("UPDATE disputes SET status = 'resolved' WHERE id = ?");
            $stmt->execute([$data->id]);
            echo json_encode(["status" => "success", "message" => "Dispute Resolved"]);
            break;
            
        case 'approve_kyc':
            $stmt = $db->prepare("UPDATE users SET kyc_status = 'verified' WHERE id = ?");
            $stmt->execute([$data->id]);
            
            // Log Activity
            $logStmt = $db->prepare("INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)");
            $logStmt->execute([$data->id, 'Identity Verified', "KYC verified by Advocate"]);
            
            echo json_encode(["status" => "success", "message" => "Identity Verified"]);
            break;

        case 'reject_kyc':
            $stmt = $db->prepare("UPDATE users SET kyc_status = 'rejected' WHERE id = ?");
            $stmt->execute([$data->id]);
            
            // Log Activity
            $logStmt = $db->prepare("INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)");
            $logStmt->execute([$data->id, 'Identity Rejected', "KYC rejected by Advocate"]);
            
            echo json_encode(["status" => "success", "message" => "Identity Rejected"]);
            break;

        case 'approve_purchase':
            $cycleId = $data->id;
            
            // 1. Get cycle info
            $cInfo = $db->prepare("SELECT user_id, total_value, ledger_txn_id, COALESCE(NULLIF(cashback_eligible_amount,0), total_value) AS cashback_eligible_amount FROM cashback_cycles WHERE id = ? AND status = 'pending'");
            $cInfo->execute([$cycleId]);
            $cycle = $cInfo->fetch(PDO::FETCH_ASSOC);

            if (!$cycle) {
                throw new Exception("Purchase record not found or already processed.");
            }

            $userId = $cycle['user_id'];

            $db->beginTransaction();

            // 2. Update Cashback Cycle status to active
            $db->prepare("UPDATE cashback_cycles SET status = 'active' WHERE id = ?")
               ->execute([$cycleId]);

            // Approve: activate agreement + complete transaction
            $db->prepare("UPDATE agreements SET status = 'active', agreement_date = NOW() WHERE user_id = ? AND status = 'pending' ORDER BY id DESC LIMIT 1")
               ->execute([$userId]);

            // Mark the cycle's exact ledger transaction completed
            $txId = $cycle['ledger_txn_id'] ?? null;
            if (!$txId) {
                $txStmt = $db->prepare("SELECT t.id FROM transactions t JOIN wallets w ON t.wallet_id = w.id
                                              WHERE w.user_id = ? AND t.category = 'purchase_request' AND t.status = 'pending'
                                              ORDER BY t.id DESC LIMIT 1");
                $txStmt->execute([$userId]);
                $txId = $txStmt->fetchColumn();
            }
            if ($txId) {
                $db->prepare("UPDATE transactions SET status = 'completed', description = REPLACE(description, 'Awaiting Admin Approval', 'Approved') WHERE id = ?")
                   ->execute([$txId]);
            }

            // --- 5-LEVEL REFERRAL COMMISSION LOGIC ---
            $investAmount = floatval($cycle['cashback_eligible_amount']);

            // Fetch commission percentages from settings
            $stmtSet = $db->query("SELECT config_key, config_value FROM platform_settings WHERE config_key LIKE 'referral_commission_l%'");
            $rates = $stmtSet->fetchAll(PDO::FETCH_KEY_PAIR);
            
            $currentUserId = $userId;
            for ($level = 1; $level <= 5; $level++) {
                // Find the referrer
                $rStmt = $db->prepare("SELECT referrer_id, name FROM users WHERE id = ?");
                $rStmt->execute([$currentUserId]);
                $u = $rStmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$u || !$u['referrer_id']) break; // No more referrers in the chain
                
                $referrerId = $u['referrer_id'];
                $rateKey = "referral_commission_l$level";
                $rate = isset($rates[$rateKey]) ? floatval($rates[$rateKey]) : 0;
                
                if ($rate > 0) {
                    $commission = ($investAmount * $rate) / 100;
                    
                    // 1. Update Referrer's Wallet
                    $db->prepare("UPDATE wallets SET balance = balance + :amt, total_earned = total_earned + :amt WHERE user_id = :rid")
                        ->execute(['amt' => $commission, 'rid' => $referrerId]);
                    
                    // 2. Get Referrer's Wallet ID
                    $wStmt = $db->prepare("SELECT id FROM wallets WHERE user_id = ?");
                    $wStmt->execute([$referrerId]);
                    $wId = $wStmt->fetchColumn();
                    
                    if ($wId) {
                        // 3. Log Transaction
                        $investorName = $u['name'];
                        $desc = "L$level Referral Commission from $investorName (" . number_format($rate, 1) . "%)";
                        $db->prepare("INSERT INTO transactions (wallet_id, amount, type, category, status, description) VALUES (:wid, :amt, 'credit', 'referral', 'completed', :desc)")
                            ->execute(['wid' => $wId, 'amt' => $commission, 'desc' => $desc]);
                    }
                }
                
                $currentUserId = $referrerId; // Move to next level up the chain
            }

            // Notify user
            try {
                $db->prepare("INSERT INTO notifications (user_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, 'success', 0, NOW())")
                    ->execute([$userId, 'Purchase Approved', 'Your purchase request has been approved by the Advocate. Daily rewards are now active.']);
            } catch (Exception $notifErr) {}

            // Log activity
            $logStmt = $db->prepare("INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)");
            $logStmt->execute([0, 'legal_approval', "Purchase #{$cycleId} approved & activated by Advocate"]);

            $db->commit();
            echo json_encode(["status" => "success", "message" => "Purchase Approved & Activated"]);
            break;

        case 'reject_purchase':
            $cycleId = $data->id;

            $info = $db->prepare("SELECT user_id, total_value, ledger_txn_id FROM cashback_cycles WHERE id = ?");
            $info->execute([$cycleId]);
            $cycle = $info->fetch(PDO::FETCH_ASSOC);
            if (!$cycle) {
                throw new Exception("Purchase record not found or already deleted.");
            }

            $db->beginTransaction();

            // Remove the linked transaction from ledger
            if (!empty($cycle['ledger_txn_id'])) {
                $db->prepare("DELETE FROM transactions WHERE id = ?")->execute([$cycle['ledger_txn_id']]);
            } else {
                $wid = $db->prepare("SELECT id FROM wallets WHERE user_id = ?");
                $wid->execute([$cycle['user_id']]);
                $walletId = $wid->fetchColumn();
                if ($walletId) {
                    $db->prepare("DELETE FROM transactions
                                  WHERE wallet_id = :wid AND category = 'purchase_request' AND amount = :amt
                                  ORDER BY id DESC LIMIT 1")
                       ->execute(['wid' => $walletId, 'amt' => $cycle['total_value']]);
                }
            }

            // Remove the linked agreement and cashback applications
            try { $db->prepare("DELETE FROM cashback_applications WHERE cycle_id = ?")->execute([$cycleId]); } catch (Exception $e) {}
            try { $db->prepare("DELETE FROM agreements WHERE user_id = ? AND status = 'pending' ORDER BY id DESC LIMIT 1")->execute([$cycle['user_id']]); } catch (Exception $e) {}

            // Remove the cycle itself
            $db->prepare("DELETE FROM cashback_cycles WHERE id = ?")->execute([$cycleId]);

            // Notify user
            try {
                $db->prepare("INSERT INTO notifications (user_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, 'warning', 0, NOW())")
                    ->execute([$cycle['user_id'], 'Purchase Rejected', 'Your purchase request was rejected by the Advocate.']);
            } catch (Exception $notifErr) {}

            // Log Activity
            $logStmt = $db->prepare("INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)");
            $logStmt->execute([0, 'legal_rejection', "Purchase #{$cycleId} rejected and deleted by Advocate"]);

            $db->commit();
            echo json_encode(["status" => "success", "message" => "Purchase Rejected & Removed"]);
            break;

        default:
            echo json_encode(["status" => "error", "message" => "Unknown legal action"]);
    }
} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
