<?php
// fix_transactions_enum.php
require_once 'config.php';

try {
    $pdo->exec("ALTER TABLE transactions MODIFY COLUMN category ENUM('purchase', 'purchase_request', 'referral', 'cashback', 'payout', 'withdrawal', 'manual', 'deposit', 'other') NOT NULL DEFAULT 'other'");
    echo "✅ Transactions category enum updated successfully.\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
