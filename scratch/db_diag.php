<?php
require_once 'api/config/db.php';
$database = new Database();
$db = $database->getConnection();
echo "Users: " . $db->query("SELECT COUNT(*) FROM users")->fetchColumn() . "\n";
echo "Transactions: " . $db->query("SELECT COUNT(*) FROM transactions")->fetchColumn() . "\n";
echo "Investments: " . $db->query("SELECT COUNT(*) FROM cashback_cycles")->fetchColumn() . "\n";
?>
