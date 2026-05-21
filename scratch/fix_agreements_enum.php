<?php
// scratch/fix_agreements_enum.php
header("Content-Type: text/plain");
require_once '../api/config/db.php';
$database = new Database();
$db = $database->getConnection();

echo "=== FIXING AGREEMENTS ENUM ===\n\n";

// Fix agreements status ENUM to include all needed values
try {
    $db->exec("ALTER TABLE agreements MODIFY COLUMN status ENUM('pending','active','signed','completed','expired','cancelled','rejected') DEFAULT 'pending'");
    echo "✓ agreements.status ENUM updated\n";
} catch(Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}

// Verify
$cols = $db->query("SHOW COLUMNS FROM agreements WHERE Field = 'status'")->fetch(PDO::FETCH_ASSOC);
echo "New type: " . $cols['Type'] . "\n";

// Now test the full investments API
echo "\n=== TESTING INVESTMENTS API ===\n";
$stmt = $db->query("SELECT c.id, c.user_id, c.total_value, c.status, u.name FROM cashback_cycles c JOIN users u ON c.user_id = u.id WHERE c.status = 'pending'");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Found " . count($rows) . " pending investments:\n";
foreach($rows as $r) echo "  cycle #{$r['id']} - {$r['name']} - ₹{$r['total_value']} - status={$r['status']}\n";

echo "\n=== DONE ===\n";
?>
