<?php
require_once 'c:/xampp3.0\htdocs\Makkal_Gold/api/config/db.php';
$database = new Database();
$db = $database->getConnection();

$uid = 9;
$stmt = $db->prepare("SELECT * FROM agreements WHERE user_id = ?");
$stmt->execute([$uid]);
$agreements = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "AGREEMENTS FOR USER $uid:\n";
print_r($agreements);
?>
