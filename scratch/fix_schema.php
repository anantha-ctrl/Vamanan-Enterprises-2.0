<?php
// scratch/fix_schema.php
// Run this at: http://localhost/Makkal_Gold/scratch/fix_schema.php
header("Content-Type: text/plain");

require_once '../api/config/db.php';
$database = new Database();
$db = $database->getConnection();

echo "=== FIXING DATABASE SCHEMA ===\n\n";

// 1. Fix cashback_cycles status ENUM to include 'pending', 'cancelled', 'rejected'
echo "1. Fixing cashback_cycles.status ENUM...\n";
try {
    $db->exec("ALTER TABLE cashback_cycles MODIFY COLUMN status ENUM('pending','active','paused','completed','cancelled','rejected') DEFAULT 'pending'");
    echo "   ✓ ENUM updated successfully\n";
} catch(Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

// 2. Fix existing blank-status cycles to 'pending'
echo "\n2. Fixing existing blank-status cycles...\n";
try {
    $count = $db->exec("UPDATE cashback_cycles SET status = 'pending' WHERE status = '' OR status IS NULL");
    echo "   ✓ Updated $count rows to 'pending'\n";
} catch(Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

// 3. Fix transactions category - check if 'purchase_request' works
echo "\n3. Checking transactions table...\n";
try {
    $cols = $db->query("SHOW COLUMNS FROM transactions WHERE Field = 'category'")->fetch(PDO::FETCH_ASSOC);
    echo "   category type: " . $cols['Type'] . "\n";
    
    // If it's an ENUM, we may need to add 'purchase_request'
    if (strpos($cols['Type'], 'enum') !== false && strpos($cols['Type'], 'purchase_request') === false) {
        // Extract existing values and add purchase_request
        preg_match_all("/'([^']+)'/", $cols['Type'], $matches);
        $values = $matches[1];
        $values[] = 'purchase_request';
        $enumStr = "'" . implode("','", $values) . "'";
        $db->exec("ALTER TABLE transactions MODIFY COLUMN category ENUM($enumStr)");
        echo "   ✓ Added 'purchase_request' to category ENUM\n";
    } else {
        echo "   ✓ category column OK (type: {$cols['Type']})\n";
    }
} catch(Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

// 4. Fix transactions status ENUM if needed
echo "\n4. Checking transactions.status...\n";
try {
    $cols = $db->query("SHOW COLUMNS FROM transactions WHERE Field = 'status'")->fetch(PDO::FETCH_ASSOC);
    echo "   status type: " . $cols['Type'] . "\n";
    
    if (strpos($cols['Type'], 'enum') !== false) {
        preg_match_all("/'([^']+)'/", $cols['Type'], $matches);
        $values = $matches[1];
        $needed = ['pending', 'completed', 'failed', 'cancelled'];
        $changed = false;
        foreach ($needed as $v) {
            if (!in_array($v, $values)) {
                $values[] = $v;
                $changed = true;
            }
        }
        if ($changed) {
            $enumStr = "'" . implode("','", $values) . "'";
            $db->exec("ALTER TABLE transactions MODIFY COLUMN status ENUM($enumStr) DEFAULT 'completed'");
            echo "   ✓ Updated status ENUM\n";
        } else {
            echo "   ✓ status ENUM already complete\n";
        }
    }
} catch(Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

// 5. Fix blank transaction statuses
echo "\n5. Fixing blank transaction statuses...\n";
try {
    $count = $db->exec("UPDATE transactions SET status = 'pending' WHERE status = '' OR status IS NULL");
    echo "   ✓ Updated $count transactions to 'pending'\n";
} catch(Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

// 6. Fix agreements status if ENUM
echo "\n6. Checking agreements.status...\n";
try {
    $cols = $db->query("SHOW COLUMNS FROM agreements WHERE Field = 'status'")->fetch(PDO::FETCH_ASSOC);
    echo "   status type: " . $cols['Type'] . "\n";
    
    if (strpos($cols['Type'], 'enum') !== false && strpos($cols['Type'], 'pending') === false) {
        $db->exec("ALTER TABLE agreements MODIFY COLUMN status ENUM('pending','active','completed','cancelled','rejected') DEFAULT 'pending'");
        echo "   ✓ Updated agreements status ENUM\n";
    } else {
        echo "   ✓ agreements status OK\n";
    }
} catch(Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

// 7. Verify fix
echo "\n=== VERIFICATION ===\n";
$rows = $db->query("SELECT id, user_id, status, total_value FROM cashback_cycles ORDER BY id DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
foreach($rows as $r) echo "  cycle id={$r['id']} user={$r['user_id']} status='{$r['status']}' total={$r['total_value']}\n";

$pending = $db->query("SELECT COUNT(*) as cnt FROM cashback_cycles WHERE status = 'pending'")->fetch(PDO::FETCH_ASSOC);
echo "\n  Pending cycles count: {$pending['cnt']}\n";

echo "\n=== SCHEMA FIX COMPLETE ===\n";
?>
