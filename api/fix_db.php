<?php
// api/fix_db.php
require_once 'config.php';

try {
    // Check if user_id exists, if not, add it
    $pdo->exec("ALTER TABLE notifications ADD COLUMN user_id INT NULL AFTER id");
    echo "<h1>✅ Success: user_id column added to notifications table!</h1>";
    echo "<p>You can now go back to your Admin Dashboard and send notifications.</p>";
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "<h1>ℹ️ Column already exists!</h1>";
        echo "<p>Your database is already up to date.</p>";
    } else {
        echo "<h1>❌ Error fixing database:</h1>";
        echo "<pre>" . $e->getMessage() . "</pre>";
    }
}
?>
