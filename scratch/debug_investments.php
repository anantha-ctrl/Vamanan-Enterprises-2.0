<?php
// scratch/debug_investments.php - Run this at: http://localhost/Makkal_Gold/scratch/debug_investments.php
header("Content-Type: text/plain");

require_once '../api/config/db.php';
$database = new Database();
$db = $database->getConnection();

echo "=== MAKKAL GOLD INVESTMENT DEBUG ===\n\n";

// 1. Check tables exist
echo "--- 1. TABLE EXISTENCE ---\n";
foreach(['cashback_cycles', 'agreements', 'transactions', 'users', 'products', 'wallets'] as $tbl) {
    try {
        $db->query("SELECT 1 FROM $tbl LIMIT 1");
        echo "✓ $tbl EXISTS\n";
    } catch(Exception $e) {
        echo "✗ $tbl MISSING: " . $e->getMessage() . "\n";
    }
}

// 2. Check cashback_cycles columns
echo "\n--- 2. cashback_cycles COLUMNS ---\n";
$cols = $db->query("SHOW COLUMNS FROM cashback_cycles")->fetchAll(PDO::FETCH_ASSOC);
foreach($cols as $c) echo "  " . $c['Field'] . " (" . $c['Type'] . ")\n";

// 3. Check all cashback_cycles
echo "\n--- 3. ALL CASHBACK CYCLES ---\n";
$rows = $db->query("SELECT * FROM cashback_cycles ORDER BY id DESC LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
if(count($rows) === 0) echo "  EMPTY - No cycles found!\n";
foreach($rows as $r) echo "  id={$r['id']} user={$r['user_id']} status={$r['status']} total={$r['total_value']}\n";

// 4. Check pending cycles
echo "\n--- 4. PENDING CYCLES ---\n";
$rows = $db->query("SELECT * FROM cashback_cycles WHERE status = 'pending'")->fetchAll(PDO::FETCH_ASSOC);
if(count($rows) === 0) echo "  NONE FOUND\n";
foreach($rows as $r) echo "  id={$r['id']} user_id={$r['user_id']} total={$r['total_value']}\n";

// 5. Check pending transactions
echo "\n--- 5. PENDING TRANSACTIONS ---\n";
$rows = $db->query("SELECT t.*, w.user_id FROM transactions t JOIN wallets w ON t.wallet_id = w.id WHERE t.status = 'pending' LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
if(count($rows) === 0) echo "  NONE FOUND\n";
foreach($rows as $r) echo "  tx_id={$r['id']} user={$r['user_id']} cat={$r['category']} amount={$r['amount']}\n";

// 6. Test investments.php query
echo "\n--- 6. INVESTMENTS.PHP QUERY TEST ---\n";
try {
    $stmt = $db->query("SELECT c.id as cycle_id, c.user_id, c.total_value, c.daily_payout, c.status as cycle_status, u.name as user_name, u.email as user_email, p.name as product_name, a.id as agreement_id FROM cashback_cycles c JOIN users u ON c.user_id = u.id LEFT JOIN agreements a ON (a.user_id = c.user_id AND a.status = 'pending') LEFT JOIN products p ON a.product_id = p.id WHERE c.status = 'pending' GROUP BY c.id");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "  Query OK - Returned " . count($rows) . " rows\n";
    foreach($rows as $r) echo "  => cycle={$r['cycle_id']} user={$r['user_name']} product=" . ($r['product_name'] ?? 'NULL') . "\n";
} catch(Exception $e) {
    echo "  QUERY ERROR: " . $e->getMessage() . "\n";
}

// 7. Check agreements
echo "\n--- 7. PENDING AGREEMENTS ---\n";
$rows = $db->query("SELECT * FROM agreements WHERE status = 'pending' LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
if(count($rows) === 0) echo "  NONE FOUND\n";
foreach($rows as $r) echo "  id={$r['id']} user={$r['user_id']} product={$r['product_id']} status={$r['status']}\n";

echo "\n=== END DEBUG ===\n";
?>
