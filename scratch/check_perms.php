<?php
require_once 'c:/xampp3.0/htdocs/Makkal_Gold/api/config.php';
$stmt = $pdo->query("SELECT name, role, permissions FROM users WHERE role != 'customer'");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
