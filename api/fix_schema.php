<?php
require_once 'config.php';
header("Content-Type: application/json");

$results = [];

function addColumn($pdo, $table, $column, $definition) {
    global $results;
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM `$table` LIKE '$column'");
        if ($stmt->rowCount() == 0) {
            $pdo->exec("ALTER TABLE `$table` ADD COLUMN `$column` $definition");
            $results[] = "Added $column to $table";
        } else {
            $results[] = "$column already exists in $table";
        }
    } catch (Exception $e) {
        $results[] = "Error adding $column to $table: " . $e->getMessage();
    }
}

// Fix cashback_cycles
addColumn($pdo, 'cashback_cycles', 'transaction_id', 'VARCHAR(255) NULL');
addColumn($pdo, 'cashback_cycles', 'payment_screenshot', 'VARCHAR(255) NULL');
addColumn($pdo, 'cashback_cycles', 'asset_type', 'VARCHAR(20) DEFAULT "gold"');
addColumn($pdo, 'cashback_cycles', 'weight', 'DECIMAL(10,3) DEFAULT 0');
addColumn($pdo, 'cashback_cycles', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

// Fix users
addColumn($pdo, 'users', 'phone', 'VARCHAR(20) NULL');

// Fix transactions
try {
    $pdo->exec("ALTER TABLE transactions MODIFY COLUMN category ENUM('purchase', 'purchase_request', 'referral', 'cashback', 'payout', 'withdrawal', 'liquidation', 'manual', 'deposit', 'other') DEFAULT 'other'");
    $results[] = "Updated transactions category enum";
} catch (Exception $e) {
    $results[] = "Error updating transactions enum: " . $e->getMessage();
}

echo json_encode(["status" => "success", "logs" => $results]);
?>
