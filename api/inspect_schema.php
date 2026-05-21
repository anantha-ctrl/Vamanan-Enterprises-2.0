<?php
header("Content-Type: application/json");
require_once 'config.php';

$tables = ['users', 'wallets', 'products', 'transactions', 'withdrawals', 'cashback_cycles', 'notifications'];
$report = [];

foreach ($tables as $table) {
    try {
        $stmt = $pdo->query("DESCRIBE $table");
        $report[$table] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $report[$table] = "ERROR: " . $e->getMessage();
    }
}

echo json_encode($report, JSON_PRETTY_PRINT);
?>