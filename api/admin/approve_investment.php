<?php
// api/admin/approve_investment.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config.php';
// $db is already initialized in config.php as $pdo
$database = $pdo; 

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->cycle_id) || !isset($data->status)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "cycle_id and status are required."]);
    exit;
}

$status = $data->status;   // 'active' or 'rejected'
$cycleId = $data->cycle_id;

if (!in_array($status, ['active', 'rejected'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Status must be 'active' or 'rejected'."]);
    exit;
}

try {
    $database->beginTransaction();

    // 1. Get cycle info
    $cInfo = $database->prepare("SELECT user_id, total_value, ledger_txn_id, COALESCE(NULLIF(cashback_eligible_amount,0), total_value) AS cashback_eligible_amount FROM cashback_cycles WHERE id = :id AND status = 'pending'");
    $cInfo->execute(['id' => $cycleId]);
    $cycle = $cInfo->fetch(PDO::FETCH_ASSOC);

    if (!$cycle) {
        throw new Exception("Cycle not found or already processed.");
    }

    $userId = $cycle['user_id'];

    // 2. Update Cashback Cycle status
    $database->prepare("UPDATE cashback_cycles SET status = :status WHERE id = :id")
       ->execute(['status' => $status, 'id' => $cycleId]);

    if ($status === 'active') {
        // Ensure the stored gross daily payout is correct on activation (1% of the ex-GST
        // base). Guards against legacy/pending cycles that were saved with daily_payout = 0.
        $rateStmt = $database->prepare("SELECT config_value FROM platform_settings WHERE config_key = 'daily_cashback_rate'");
        $rateStmt->execute();
        $dailyRate = (float)($rateStmt->fetchColumn() ?: 1);
        $dailyPayout = round(((float)$cycle['cashback_eligible_amount']) * ($dailyRate / 100), 2);
        $database->prepare("UPDATE cashback_cycles SET daily_payout = :dp WHERE id = :id")
           ->execute(['dp' => $dailyPayout, 'id' => $cycleId]);

        // APPROVE: activate agreement + complete transaction
        $database->prepare("UPDATE agreements SET status = 'active', agreement_date = NOW() WHERE user_id = :uid AND status = 'pending' ORDER BY id DESC LIMIT 1")
           ->execute(['uid' => $userId]);

        // Mark the cycle's exact ledger transaction completed (fallback: latest pending for the user).
        $txId = $cycle['ledger_txn_id'] ?? null;
        if (!$txId) {
            $txStmt = $database->prepare("SELECT t.id FROM transactions t JOIN wallets w ON t.wallet_id = w.id
                                          WHERE w.user_id = :uid AND t.category = 'purchase_request' AND t.status = 'pending'
                                          ORDER BY t.id DESC LIMIT 1");
            $txStmt->execute(['uid' => $userId]);
            $txId = $txStmt->fetchColumn();
        }
        if ($txId) {
            $database->prepare("UPDATE transactions SET status = 'completed', description = REPLACE(description, 'Awaiting Admin Approval', 'Approved') WHERE id = :tid")
               ->execute(['tid' => $txId]);
        }

        // --- 5-LEVEL REFERRAL COMMISSION LOGIC ---
        // GST-exclusive: commission base is the product subtotal (cashback_eligible_amount), never the GST-inclusive total.
        $investAmount = floatval($cycle['cashback_eligible_amount']);

        // Fetch commission percentages from settings
        $stmtSet = $database->query("SELECT config_key, config_value FROM platform_settings WHERE config_key LIKE 'referral_commission_l%'");
        $rates = $stmtSet->fetchAll(PDO::FETCH_KEY_PAIR);
        
        $currentUserId = $userId;
        for ($level = 1; $level <= 5; $level++) {
            // Find the referrer
            $rStmt = $database->prepare("SELECT referrer_id, name FROM users WHERE id = :uid");
            $rStmt->execute(['uid' => $currentUserId]);
            $u = $rStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$u || !$u['referrer_id']) break; // No more referrers in the chain
            
            $referrerId = $u['referrer_id'];
            $rateKey = "referral_commission_l$level";
            $rate = isset($rates[$rateKey]) ? floatval($rates[$rateKey]) : 0;
            
            if ($rate > 0) {
                $commission = ($investAmount * $rate) / 100;
                
                // 1. Update Referrer's Wallet
                $database->prepare("UPDATE wallets SET balance = balance + :amt, total_earned = total_earned + :amt WHERE user_id = :rid")
                    ->execute(['amt' => $commission, 'rid' => $referrerId]);
                
                // 2. Get Referrer's Wallet ID
                $wStmt = $database->prepare("SELECT id FROM wallets WHERE user_id = :rid");
                $wStmt->execute(['rid' => $referrerId]);
                $wId = $wStmt->fetchColumn();
                
                if ($wId) {
                    // 3. Log Transaction
                    $investorName = $u['name'];
                    $desc = "L$level Referral Commission from $investorName (" . number_format($rate, 1) . "%)";
                    $database->prepare("INSERT INTO transactions (wallet_id, amount, type, category, status, description) VALUES (:wid, :amt, 'credit', 'referral', 'completed', :desc)")
                        ->execute(['wid' => $wId, 'amt' => $commission, 'desc' => $desc]);
                }
            }
            
            $currentUserId = $referrerId; // Move to next level up the chain
        }

    } else {
        // REJECT: reject agreement + fail transaction
        $database->prepare("UPDATE agreements SET status = 'rejected' WHERE user_id = :uid AND status = 'pending' ORDER BY id DESC LIMIT 1")
           ->execute(['uid' => $userId]);

        // Mark the cycle's exact ledger transaction failed (fallback: latest pending for the user).
        $txId = $cycle['ledger_txn_id'] ?? null;
        if (!$txId) {
            $txStmt = $database->prepare("SELECT t.id FROM transactions t JOIN wallets w ON t.wallet_id = w.id
                                          WHERE w.user_id = :uid AND t.category = 'purchase_request' AND t.status = 'pending'
                                          ORDER BY t.id DESC LIMIT 1");
            $txStmt->execute(['uid' => $userId]);
            $txId = $txStmt->fetchColumn();
        }
        if ($txId) {
            $database->prepare("UPDATE transactions SET status = 'failed', description = REPLACE(description, 'Awaiting Admin Approval', 'Rejected by Admin') WHERE id = :tid")
               ->execute(['tid' => $txId]);
        }
    }

    $database->commit();

    // Notify the investor
    try {
        if ($status === 'active') {
            $database->prepare("INSERT INTO notifications (user_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, 'success', 0, NOW())")
                ->execute([$userId, 'Investment Approved', 'Your investment has been approved! Daily rewards are now active and will be credited every day.']);
        } else {
            $database->prepare("INSERT INTO notifications (user_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, 'warning', 0, NOW())")
                ->execute([$userId, 'Investment Rejected', 'Your investment request was rejected. Please contact support for more details or resubmit.']);
        }
    } catch (Exception $notifErr) { /* Non-critical */ }

    $actionLabel = $status === 'active' ? 'Approved & Activated' : 'Rejected';
    echo json_encode([
        "status" => "success",
        "message" => "Investment has been $actionLabel successfully."
    ]);

} catch (Exception $e) {
    if ($database->inTransaction()) $database->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "ADMIN_ERR: " . $e->getMessage()]);
}
?>
