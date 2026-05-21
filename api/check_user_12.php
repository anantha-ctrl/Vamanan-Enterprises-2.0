<?php
require_once 'config.php';
$userId = 12;

echo "--- CYCLES ---\n";
$s = $pdo->prepare("SELECT id, user_id, total_value, paid_amount, status, asset_type, weight FROM cashback_cycles WHERE user_id = ?");
$s->execute([$userId]);
print_r($s->fetchAll(PDO::FETCH_ASSOC));

echo "\n--- TRANSACTIONS ---\n";
$s2 = $pdo->prepare("SELECT t.* FROM transactions t JOIN wallets w ON t.wallet_id = w.id WHERE w.user_id = ? AND t.category = 'cashback'");
$s2->execute([$userId]);
print_r($s2->fetchAll(PDO::FETCH_ASSOC));
?>
