<?php
// api/customer/cancel_request.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

require_once '../config/db.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(isset($data->user_id) && isset($data->transaction_id)) {
    try {
        $db->beginTransaction();

        $userId = $data->user_id;
        $transId = $data->transaction_id;

        // 1. Delete Transaction
        $tQuery = "DELETE t FROM transactions t 
                   JOIN wallets w ON t.wallet_id = w.id 
                   WHERE t.id = :trans_id AND w.user_id = :user_id AND t.status = 'pending'";
        $tStmt = $db->prepare($tQuery);
        $tStmt->execute(['trans_id' => $transId, 'user_id' => $userId]);

        if($tStmt->rowCount() > 0) {
            // 2. Delete Pending Cycle for this user
            $cQuery = "DELETE FROM cashback_cycles 
                       WHERE user_id = :user_id AND status = 'pending' 
                       ORDER BY id DESC LIMIT 1";
            $cStmt = $db->prepare($cQuery);
            $cStmt->execute(['user_id' => $userId]);

            // 3. Delete Pending Agreement for this user
            $aQuery = "DELETE FROM agreements 
                       WHERE user_id = :user_id AND status = 'pending' 
                       ORDER BY id DESC LIMIT 1";
            $aStmt = $db->prepare($aQuery);
            $aStmt->execute(['user_id' => $userId]);

            $db->commit();
            echo json_encode(["status" => "success", "message" => "Your investment request has been permanently deleted."]);
        } else {
            throw new Exception("Transaction not found or already processed (only pending requests can be deleted).");
        }

    } catch (Exception $e) {
        if($db->inTransaction()) $db->rollBack();
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Incomplete data."]);
}
?>
