<?php
require_once 'config/db.php';
$database = new Database();
$db = $database->getConnection();
echo json_encode($db->query("SELECT VERSION()")->fetch());
?>
