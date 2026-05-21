<?php
require_once __DIR__ . '/api/config/db.php';
$database = new Database();
$db = $database->getConnection();

try {
    $db->exec("ALTER TABLE users 
        ADD COLUMN address TEXT NULL,
        ADD COLUMN phone VARCHAR(20) NULL,
        ADD COLUMN aadhar_no VARCHAR(20) NULL,
        ADD COLUMN pan_no VARCHAR(20) NULL,
        ADD COLUMN kyc_document VARCHAR(255) NULL");
    echo "Columns added successfully";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
