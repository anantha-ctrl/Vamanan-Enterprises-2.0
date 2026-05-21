<?php
// api/admin/adjust_wallet.php

error_reporting(0);
ini_set('display_errors', 0);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    require_once '../config/db.php';
    require_once '../models/Wallet.php';

    $database = new Database();
    $db = $database->getConnection();
    if (!$db) throw new Exception("Database connection failed");

    $data = json_decode(file_get_contents("php://input"));

    if(!empty($data->user_id) && !empty($data->amount) && !empty($data->type)) {
        $db->beginTransaction();

        $userId = $data->user_id;
        $amount = (float)$data->amount;
        $type   = $data->type; 
        $reason = $data->reason ?? 'System adjustment';
        $category = $data->category ?? 'purchase';

        // 1. Get Wallet ID
        $stmt = $db->prepare("SELECT id FROM wallets WHERE user_id = ?");
        $stmt->execute([$userId]);
        $wallet = $stmt->fetch(PDO::FETCH_ASSOC);

        if(!$wallet) throw new Exception("Wallet not found for this user.");

        // 2. Cashback Cycle Detection
        // Now using explicit category from frontend
        $isCashbackPayout = ($category === 'cashback' || ($type === 'credit' && (stripos($reason, 'cashback') !== false || stripos($reason, 'daily') !== false)));
        
        if ($isCashbackPayout) {
            $category = 'cashback';
            
            // Update cycle if exists
            $cStmt = $db->prepare("SELECT * FROM cashback_cycles WHERE user_id = ? AND status = 'active' ORDER BY created_at ASC LIMIT 1");
            $cStmt->execute([$userId]);
            $cycle = $cStmt->fetch(PDO::FETCH_ASSOC);

            if ($cycle) {
                $newDays = (int)$cycle['days_completed'] + 1;
                $newEarned = (float)$cycle['total_earned'] + $amount;
                $newStatus = ($newEarned >= (float)$cycle['total_value'] || $newDays >= 100) ? 'completed' : 'active';

                $upStmt = $db->prepare("UPDATE cashback_cycles SET days_completed = ?, total_earned = ?, status = ?, updated_at = NOW() WHERE id = ?");
                $upStmt->execute([$newDays, $newEarned, $newStatus, $cycle['id']]);
            }
        }

        // 3. Update Balance
        $adjustmentAmount = ($type === 'debit') ? -$amount : $amount;
        $earnedIncrement = ($type === 'credit') ? $amount : 0;
        
        $db->prepare("UPDATE wallets SET balance = balance + ?, total_earned = total_earned + ? WHERE id = ?")
           ->execute([$adjustmentAmount, $earnedIncrement, $wallet['id']]);

        // 4. Log Transaction
        $db->prepare("INSERT INTO transactions (wallet_id, type, category, amount, description, status) VALUES (?, ?, ?, ?, ?, 'completed')")
           ->execute([$wallet['id'], $type, $category, $amount, "MANUAL: " . $reason]);

        $db->commit();
        echo json_encode(["status" => "success", "message" => "Adjustment completed successfully"]);

    } else {
        throw new Exception("Missing required fields (user_id, amount, type)");
    }

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    echo json_encode([
        "status" => "error", 
        "message" => "Adjustment failed: " . $e->getMessage(),
        "file" => basename($e->getFile()),
        "line" => $e->getLine()
    ]);
}
?>
