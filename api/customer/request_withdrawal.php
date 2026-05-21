<?php
// api/customer/request_withdrawal.php
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

if (!isset($data->user_id) || !isset($data->amount) || !isset($data->bank_details)) {
    echo json_encode(["status" => "error", "message" => "Incomplete request parameters."]);
    exit;
}

$userId = $data->user_id;
$amount = (float)$data->amount;
$bankDetails = $data->bank_details;

if ($amount < 100) {
    echo json_encode(["status" => "error", "message" => "Minimum withdrawal amount is ₹100."]);
    exit;
}

    // Migration: Self-Healing Table Schema (Must be outside transaction to avoid implicit commit)
    $db->exec("CREATE TABLE IF NOT EXISTS withdrawals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        transaction_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP NULL
    )");
    
    // Ensure bank_details exists
    try { $db->exec("ALTER TABLE withdrawals ADD COLUMN bank_details TEXT AFTER amount"); } catch(Exception $e){}
    // Ensure payment_method exists
    try { $db->exec("ALTER TABLE withdrawals ADD COLUMN payment_method VARCHAR(50) DEFAULT 'Bank Transfer' AFTER bank_details"); } catch(Exception $e){}
    // Ensure transaction_id exists
    try { $db->exec("ALTER TABLE withdrawals ADD COLUMN transaction_id VARCHAR(100) AFTER status"); } catch(Exception $e){}
    try { $db->exec("ALTER TABLE withdrawals ADD COLUMN processed_at TIMESTAMP NULL AFTER created_at"); } catch(Exception $e){}

    try {
        $db->beginTransaction();

        // Check balance
        $wData = $walletModel->getBalance($userId);
        if ($wData['balance'] < $amount) {
            throw new Exception("Insufficient liquid capital for this transaction.");
        }

        // Insert withdrawal request
        $stmt = $db->prepare("INSERT INTO withdrawals (user_id, amount, bank_details, status) VALUES (?, ?, ?, 'pending')");
        $stmt->execute([$userId, $amount, $bankDetails]);

        // Optional: Debit wallet immediately so balance is 'locked'
        $success = $walletModel->debit($userId, $amount, 'withdrawal', "Withdrawal request for ₹" . number_format($amount, 2) . " initialized.");
        if (!$success) throw new Exception("Failed to initialize capital lock.");

        $db->commit();
    echo json_encode([
        "status" => "success",
        "message" => "Withdrawal protocol initialized. Awaiting administrative clearance."
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
