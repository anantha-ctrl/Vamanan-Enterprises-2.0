<?php
require_once 'config.php';
$stmt = $pdo->query("SELECT * FROM platform_settings");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT);
?>
