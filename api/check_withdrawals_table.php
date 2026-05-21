<?php
require_once 'config/db.php';
$database = new Database();
$db = $database->getConnection();

try {
    $res = $db->query("SHOW TABLES LIKE 'withdrawals'");
    if ($res->rowCount() == 0) {
        echo "Table 'withdrawals' does not exist. Creating it...\n";
        $sql = "CREATE TABLE withdrawals (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            amount DECIMAL(15,2) NOT NULL,
            bank_details TEXT,
            status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            transaction_id VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            processed_at TIMESTAMP NULL
        )";
        $db->exec($sql);
        echo "Table created successfully.\n";
    } else {
        echo "Table 'withdrawals' already exists.\n";
        $cols = $db->query("DESCRIBE withdrawals")->fetchAll(PDO::FETCH_ASSOC);
        print_r($cols);
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
