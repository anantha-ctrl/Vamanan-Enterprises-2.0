<?php
require_once 'config.php';
try {
    $stmt = $pdo->query("SELECT id, name, email, role, status FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($users, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo $e->getMessage();
}
?>
