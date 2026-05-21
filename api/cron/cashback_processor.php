<?php
// api/cron/cashback_processor.php

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../models/Wallet.php';

$database = new Database();
$db = $database->getConnection();
$wallet = new Wallet($db);

$today = date('Y-m-d');

try {
    $query = "SELECT * FROM cashback_cycles 
              WHERE status = 'active' 
              AND (last_paid_at IS NULL OR last_paid_at < :today)
              AND paid_amount < total_value";
    
    $stmt = $db->prepare($query);
    $stmt->execute(['today' => $today]);
    $cycles = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $processed = 0;
    foreach ($cycles as $cycle) {
        $payout = $cycle['daily_payout'];

        if (($cycle['paid_amount'] + $payout) > $cycle['total_value']) {
            $payout = $cycle['total_value'] - $cycle['paid_amount'];
        }

        $description = "Daily 1% Cashback for Cycle #" . $cycle['id'];
        $success = $wallet->addTransaction($cycle['user_id'], 'credit', 'cashback', $payout, $description);

        if ($success) {
            $updateQuery = "UPDATE cashback_cycles SET 
                            paid_amount = paid_amount + :payout,
                            days_paid = days_paid + 1,
                            last_paid_at = :today,
                            status = IF((paid_amount + :payout2) >= total_value, 'completed', 'active')
                            WHERE id = :id";
            
            $updateStmt = $db->prepare($updateQuery);
            $updateStmt->execute([
                'payout' => $payout,
                'payout2' => $payout,
                'today' => $today,
                'id' => $cycle['id']
            ]);
            $processed++;
        }
    }

    echo json_encode(["status" => "success", "message" => "Processed $processed cashback cycles."]);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
