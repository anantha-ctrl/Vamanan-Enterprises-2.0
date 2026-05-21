<?php
require_once '../api/config/db.php';
$database = new Database();
$db = $database->getConnection();
try {
    $stmt = $db->query("SELECT id, name FROM users WHERE name LIKE '%KRISHNAN%'");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo $e->getMessage();
}
