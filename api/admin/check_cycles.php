<?php
require_once __DIR__ . '/../config/db.php';
$database = new Database();
$db = $database->getConnection();

$stmt = $db->query("SELECT status, COUNT(*) as count FROM cashback_cycles GROUP BY status");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT);
?>
