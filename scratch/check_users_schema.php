<?php
require_once 'c:/xampp3.0/htdocs/Makkal_Gold/api/config/db.php';
$database = new Database();
$db = $database->getConnection();
$stmt = $db->query("DESCRIBE users");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
