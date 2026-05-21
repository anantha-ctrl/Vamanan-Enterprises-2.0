<?php
require_once '../api/config/db.php';
$database = new Database();
$db = $database->getConnection();
try {
    // Add last_paid_at if missing
    $db->exec("ALTER TABLE cashback_cycles ADD COLUMN last_paid_at DATE NULL AFTER status");
    echo "Column last_paid_at added successfully.";
} catch (Exception $e) {
    echo "Error or column already exists: " . $e->getMessage();
}
?>
