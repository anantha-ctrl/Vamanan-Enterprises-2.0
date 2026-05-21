<?php
require_once '../api/config.php';
try {
    $pdo->exec("ALTER TABLE notifications ADD COLUMN is_read TINYINT(1) DEFAULT 0 AFTER type");
    echo "<h1>✅ Success: is_read column added to notifications table!</h1>";
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "<h1>ℹ️ Column already exists!</h1>";
    } else {
        echo "<h1>❌ Error: " . $e->getMessage() . "</h1>";
    }
}
?>
