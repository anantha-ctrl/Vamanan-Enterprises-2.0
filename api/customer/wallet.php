<?php
// api/customer/wallet.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../models/Wallet.php';

$database = new Database();
$db = $database->getConnection();
$walletModel = new Wallet($db);

$userId = isset($_GET['user_id']) ? $_GET['user_id'] : null;

if(!$userId) {
    echo json_encode(["status" => "error", "message" => "User ID required"]);
    exit;
}

try {
    // 1. Fetch Wallet Balance
    $wallet = $walletModel->getBalance($userId);
    
    // 2. Fetch Transactions
    $transactions = $walletModel->getTransactions($userId);

    // 3. Fetch Referral Totals
    $rStmt = $db->prepare("SELECT SUM(amount) as total FROM transactions t JOIN wallets w ON t.wallet_id = w.id WHERE w.user_id = ? AND t.category = 'referral' AND t.status = 'completed'");
    $rStmt->execute([$userId]);
    $referralTotal = $rStmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

    // 4. Fetch Cashback Totals
    $cStmt = $db->prepare("SELECT SUM(amount) as total FROM transactions t JOIN wallets w ON t.wallet_id = w.id WHERE w.user_id = ? AND t.category = 'cashback' AND t.status = 'completed'");
    $cStmt->execute([$userId]);
    $cashbackTotal = $cStmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

    // 5. Fetch Active Investment Total
    $iStmt = $db->prepare("SELECT SUM(total_value) as total FROM cashback_cycles WHERE user_id = ? AND status = 'active'");
    $iStmt->execute([$userId]);
    $investmentTotal = $iStmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

    // 6. Fetch Pending Withdrawals
    $wStmt = $db->prepare("SELECT SUM(amount) as total FROM transactions t JOIN wallets w ON t.wallet_id = w.id WHERE w.user_id = ? AND t.type = 'debit' AND t.status = 'pending'");
    $wStmt->execute([$userId]);
    $pendingWithdrawal = $wStmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

    echo json_encode([
        "status" => "success",
        "balance" => $wallet['balance'] ?? 0.00,
        "transactions" => $transactions,
        "referral_total" => (float)$referralTotal,
        "cashback_total" => (float)$cashbackTotal,
        "investment_total" => (float)$investmentTotal,
        "pending_withdrawal" => (float)$pendingWithdrawal
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
