<?php
// api/advocate/update_purchase.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/db.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    die(json_encode(["status" => "error", "message" => "Database connection failed"]));
}

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->cycle_id)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid request. cycle_id is required."]);
    exit;
}

$cycleId = (int)$data->cycle_id;
$weight = isset($data->weight) ? (float)$data->weight : 0.0;
$total_value = isset($data->total_value) ? (float)$data->total_value : 0.0;
$product_amount = isset($data->product_amount) ? (float)$data->product_amount : 0.0;
$gst_amount = isset($data->gst_amount) ? (float)$data->gst_amount : 0.0;
$cashback_eligible = isset($data->cashback_eligible_amount) ? (float)$data->cashback_eligible_amount : 0.0;
$transaction_id = isset($data->transaction_id) ? trim($data->transaction_id) : '';
$payment_method = isset($data->payment_method) ? trim($data->payment_method) : 'Bank Transfer';
$operator_id = isset($data->operator_id) ? (int)$data->operator_id : 0;

try {
    $db->beginTransaction();

    // 1. Fetch current purchase info
    $stmt = $db->prepare("SELECT user_id, ledger_txn_id FROM cashback_cycles WHERE id = ?");
    $stmt->execute([$cycleId]);
    $cycle = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$cycle) {
        throw new Exception("Purchase record not found.");
    }

    $userId = $cycle['user_id'];
    $ledgerTxnId = $cycle['ledger_txn_id'];

    // 2. Update cashback_cycles
    $updateCycle = $db->prepare("UPDATE cashback_cycles 
                                 SET weight = :weight, 
                                     total_value = :total_value, 
                                     product_amount = :product_amount, 
                                     gst_amount = :gst_amount, 
                                     total_amount = :total_value, 
                                     cashback_eligible_amount = :cashback_eligible, 
                                     transaction_id = :transaction_id, 
                                     payment_method = :payment_method 
                                 WHERE id = :id");
    $updateCycle->execute([
        'weight' => $weight,
        'total_value' => $total_value,
        'product_amount' => $product_amount,
        'gst_amount' => $gst_amount,
        'cashback_eligible' => $cashback_eligible,
        'transaction_id' => $transaction_id,
        'payment_method' => $payment_method,
        'id' => $cycleId
    ]);

    // 3. Update linked transaction amount in ledger
    if ($ledgerTxnId) {
        $updateTxn = $db->prepare("UPDATE transactions SET amount = ? WHERE id = ?");
        $updateTxn->execute([$total_value, $ledgerTxnId]);
    } else {
        // Fallback: update by wallet_id and category
        $wStmt = $db->prepare("SELECT id FROM wallets WHERE user_id = ?");
        $wStmt->execute([$userId]);
        $walletId = $wStmt->fetchColumn();
        if ($walletId) {
            $updateTxnFallback = $db->prepare("UPDATE transactions 
                                                SET amount = ? 
                                                WHERE wallet_id = ? AND category = 'purchase_request' AND status = 'pending'
                                                ORDER BY id DESC LIMIT 1");
            $updateTxnFallback->execute([$total_value, $walletId]);
        }
    }

    // 4. Update linked cashback applications
    $updateApp = $db->prepare("UPDATE cashback_applications 
                               SET purchase_amount = :cashback_eligible, 
                                   gst_amount = :gst_amount, 
                                   total_amount = :total_value 
                               WHERE cycle_id = :cycle_id");
    $updateApp->execute([
        'cashback_eligible' => $cashback_eligible,
        'gst_amount' => $gst_amount,
        'total_value' => $total_value,
        'cycle_id' => $cycleId
    ]);

    // 5. Log activity
    $logStmt = $db->prepare("INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)");
    $logStmt->execute([
        $operator_id, 
        'purchase_fix', 
        "Advocate corrected purchase record #$cycleId. Weight: $weight, Total: ₹$total_value, Eligible: ₹$cashback_eligible, TID: $transaction_id"
    ]);

    $db->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Purchase record #$cycleId successfully updated and synchronized."
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
