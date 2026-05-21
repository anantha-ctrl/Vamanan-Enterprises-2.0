<?php
require_once 'c:/xampp3.0/htdocs/Makkal_Gold/api/config.php';
try {
    $stmt = $pdo->query("DESCRIBE users");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Columns in users table: " . implode(", ", $columns) . "\n";
    
    $required = ['bank_name', 'account_no', 'ifsc_code', 'branch_name'];
    foreach ($required as $col) {
        if (!in_array($col, $columns)) {
            echo "Missing column: $col. Attempting to add...\n";
            $pdo->exec("ALTER TABLE users ADD COLUMN $col VARCHAR(255)");
            echo "Added $col\n";
        }
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
