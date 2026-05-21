<?php
header("Content-Type: application/json");
require_once 'config/db.php';
$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

$tables = [];
$res = $db->query("SHOW TABLES");
while ($row = $res->fetch(PDO::FETCH_NUM)) {
    $tables[] = $row[0];
}

echo json_encode(["status" => "success", "tables" => $tables]);
?>
