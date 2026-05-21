<?php
require_once 'config/db.php';
$database = new Database();
$db = $database->getConnection();
$tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
echo json_encode($tables);
?>
