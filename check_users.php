<?php
require_once 'api/config.php';
$stmt = $pdo->query("SELECT id, name, email, password, role FROM users");
$users = $stmt->fetchAll();
echo json_encode($users, JSON_PRETTY_PRINT);
?>
