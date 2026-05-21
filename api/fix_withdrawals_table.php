<?php
require_once 'config/db.php';
$database = new Database();
$db = $database->getConnection();

try {
    echo "Starting Database Synchronization Protocol...\n";

    // 1. Ensure withdrawals table exists with correct schema
    $db->exec("CREATE TABLE IF NOT EXISTS withdrawals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        transaction_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP NULL
    )");

    // 2. Add bank_details if missing
    try {
        $db->exec("ALTER TABLE withdrawals ADD COLUMN bank_details TEXT AFTER amount");
        echo "Column 'bank_details' added successfully.\n";
    } catch (Exception $e) {
        echo "Column 'bank_details' already exists or could not be added.\n";
    }

    // 3. Add payment_method if missing (used in some UI parts)
    try {
        $db->exec("ALTER TABLE withdrawals ADD COLUMN payment_method VARCHAR(50) DEFAULT 'Bank Transfer' AFTER bank_details");
        echo "Column 'payment_method' added successfully.\n";
    } catch (Exception $e) {
        echo "Column 'payment_method' already exists.\n";
    }

    echo "Sync Complete. Platform operational.\n";
} catch (Exception $e) {
    echo "CRITICAL_ERROR: " . $e->getMessage();
}
?>
