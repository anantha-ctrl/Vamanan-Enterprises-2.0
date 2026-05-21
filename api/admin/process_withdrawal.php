<?php
// api/admin/process_withdrawal.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once '../config/db.php';
require_once '../models/Wallet.php';

$database = new Database();
$db = $database->getConnection();
$walletModel = new Wallet($db);

$data = json_decode(file_get_contents("php://input"));

// Migration: Self-Healing Table Schema (Must be outside transaction)
$db->exec("CREATE TABLE IF NOT EXISTS withdrawals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL
)");
try {
    $db->exec("ALTER TABLE withdrawals ADD COLUMN bank_details TEXT AFTER amount");
} catch (Exception $e) {
}
try {
    $db->exec("ALTER TABLE withdrawals ADD COLUMN payment_method VARCHAR(50) DEFAULT 'Bank Transfer' AFTER bank_details");
} catch (Exception $e) {
}
try {
    $db->exec("ALTER TABLE withdrawals ADD COLUMN transaction_id VARCHAR(100) AFTER status");
} catch (Exception $e) {
}
try {
    $db->exec("ALTER TABLE withdrawals ADD COLUMN processed_at TIMESTAMP NULL AFTER created_at");
} catch (Exception $e) {
}

if (!isset($data->id) || !isset($data->status)) {
    echo json_encode(["status" => "error", "message" => "Incomplete request parameters."]);
    exit;
}

try {
    $db->beginTransaction();

    // Fetch withdrawal request
    $stmt = $db->prepare("SELECT * FROM withdrawals WHERE id = ?");
    $stmt->execute([$data->id]);
    $withdrawal = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$withdrawal) {
        throw new Exception("Withdrawal request node not found.");
    }

    if ($withdrawal['status'] !== 'pending') {
        throw new Exception("Request already processed.");
    }

    $status = $data->status; // 'approved' or 'rejected'
    $txnId = $data->transaction_id ?? 'N/A';

    if ($status === 'rejected') {
        // Refund the locked funds
        $success = $walletModel->credit($withdrawal['user_id'], $withdrawal['amount'], 'reversal', "Withdrawal Rejected: Capital Restored.");
        if (!$success)
            throw new Exception("Failed to restore wallet balance.");
    }
    // If approved, capital is already debited during request stage.

    // Update status
    $updateStmt = $db->prepare("UPDATE withdrawals SET status = ?, transaction_id = ?, processed_at = NOW() WHERE id = ?");
    $updateStmt->execute([$status, $txnId, $data->id]);

    $db->commit();
    echo json_encode(["status" => "success", "message" => "Withdrawal protocol " . ($status === 'approved' ? 'finalized' : 'rejected') . " successfully."]);

} catch (Exception $e) {
    if ($db->inTransaction())
        $db->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>