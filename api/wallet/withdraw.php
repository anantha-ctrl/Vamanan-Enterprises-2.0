<?php
// api/wallet/withdraw.php
require_once '../config/db.php';
require_once '../models/Wallet.php';

$database = new Database();
$db = $database->getConnection();
$walletModel = new Wallet($db);

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->user_id) && !empty($data->amount)) {
    try {
        // 1. Check current balance
        $balanceData = $walletModel->getBalance($data->user_id);
        $currentBalance = $balanceData['balance'] ?? 0;

        if($currentBalance < $data->amount) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Insufficient balance in your wallet."]);
            exit;
        }

        if($data->amount < 100) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Minimum withdrawal amount is ₹100."]);
            exit;
        }

        // 2. Record Withdrawal Request (Debit but marked as pending)
        // Note: In a real ledger, we might move this to a 'frozen' state.
        $success = $walletModel->addTransaction(
            $data->user_id, 
            'debit', 
            'withdrawal', 
            $data->amount, 
            "Withdrawal request initiated. Pending admin approval."
        );

        if($success) {
            echo json_encode([
                "status" => "success", 
                "message" => "Your withdrawal request of ₹" . $data->amount . " has been submitted successfully."
            ]);
        } else {
            throw new Exception("Database transaction failed.");
        }

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Server error: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "User ID and amount are required."]);
}
?>
