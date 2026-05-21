<?php
require_once 'config.php';
$stmt = $pdo->query("DESCRIBE cashback_cycles");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
