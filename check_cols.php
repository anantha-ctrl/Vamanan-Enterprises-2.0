<?php
require_once __DIR__ . '/api/config/db.php';
$database = new Database();
$db = $database->getConnection();
try {
    $stmt = $db->query("DESCRIBE users");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $colNames = array_column($columns, 'Field');
    echo implode(", ", $colNames);
} catch (Exception $e) {
    echo $e->getMessage();
}
?>
