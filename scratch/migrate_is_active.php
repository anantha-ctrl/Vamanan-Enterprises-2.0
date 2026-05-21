<?php
require_once __DIR__ . '/../api/config/db.php';
$database = new Database();
$db = $database->getConnection();

$tables = ['products', 'notifications'];

foreach ($tables as $table) {
    try {
        $check = $db->query("SHOW COLUMNS FROM $table LIKE 'is_active'");
        if ($check->rowCount() == 0) {
            echo "Adding is_active to $table...\n";
            $after = ($table == 'products') ? 'description' : 'type';
            $db->exec("ALTER TABLE $table ADD COLUMN is_active TINYINT(1) DEFAULT 1 AFTER $after");
            echo "Success.\n";
        } else {
            echo "is_active already exists in $table.\n";
        }
    } catch (Exception $e) {
        echo "Error with $table: " . $e->getMessage() . "\n";
    }
}
?>
