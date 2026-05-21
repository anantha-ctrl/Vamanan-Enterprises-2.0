<?php
require_once '../api/config/db.php';
$database = new Database();
$db = $database->getConnection();
try {
    $uid = 6;
    $cycles = $db->query("SELECT * FROM cashback_cycles WHERE user_id = $uid")->fetchAll(PDO::FETCH_ASSOC);
    $txs = $db->query("SELECT t.* FROM transactions t JOIN wallets w ON t.wallet_id = w.id WHERE w.user_id = $uid")->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["cycles" => $cycles, "transactions" => $txs], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo $e->getMessage();
}
