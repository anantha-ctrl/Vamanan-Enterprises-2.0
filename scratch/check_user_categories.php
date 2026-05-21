<?php
require_once '../api/config/db.php';
$database = new Database();
$db = $database->getConnection();
try {
    $uid = 6;
    $stmt = $db->query("SELECT DISTINCT category FROM transactions t JOIN wallets w ON t.wallet_id = w.id WHERE w.user_id = $uid");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo $e->getMessage();
}
