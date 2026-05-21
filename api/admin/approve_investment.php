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
    $cInfo = $database->prepare("SELECT user_id, total_value FROM cashback_cycles WHERE id = :id AND status = 'pending'");
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
        // APPROVE: activate agreement + complete transaction
        $database->prepare("UPDATE agreements SET status = 'active', agreement_date = NOW() WHERE user_id = :uid AND status = 'pending' ORDER BY id DESC LIMIT 1")
           ->execute(['uid' => $userId]);

        // Update the purchase_request transaction to completed
        $database->prepare("UPDATE transactions t 
                      JOIN wallets w ON t.wallet_id = w.id
                      SET t.status = 'completed', t.description = REPLACE(t.description, 'Awaiting Admin Approval', 'Approved')
                      WHERE w.user_id = :uid AND t.category = 'purchase_request' AND t.status = 'pending' 
                      ORDER BY t.id DESC LIMIT 1")
           ->execute(['uid' => $userId]);

        // --- 5-LEVEL REFERRAL COMMISSION LOGIC ---
        $investAmount = floatval($cycle['total_value']);
        
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

        $database->prepare("UPDATE transactions t 
                      JOIN wallets w ON t.wallet_id = w.id
                      SET t.status = 'failed', t.description = REPLACE(t.description, 'Awaiting Admin Approval', 'Rejected by Admin')
                      WHERE w.user_id = :uid AND t.category = 'purchase_request' AND t.status = 'pending' 
                      ORDER BY t.id DESC LIMIT 1")
           ->execute(['uid' => $userId]);
    }

    $database->commit();
    
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
