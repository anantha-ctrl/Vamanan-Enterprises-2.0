<?php
require_once 'c:/xampp3.0\htdocs\Makkal_Gold/api/config/db.php';
$database = new Database();
$db = $database->getConnection();

$uid = 9;
$stmt = $db->prepare("SELECT * FROM cashback_cycles WHERE user_id = ?");
$stmt->execute([$uid]);
$cycles = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "CYCLES FOR USER $uid:\n";
print_r($cycles);
?>
