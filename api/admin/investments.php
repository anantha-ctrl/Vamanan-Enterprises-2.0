<?php
// api/admin/investments.php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/db.php';
require_once '../config/migrate.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    die(json_encode(["status" => "error", "message" => "Database connection failed"]));
}

// Ensure database is up to date
runMigrations($db);

try {

    // 1. Fetch investments with minimal columns first to avoid 500 if schema is out of sync
    $query = "SELECT c.*, u.name as user_name, u.email as user_email, u.phone as user_phone, c.asset_type, c.weight 
              FROM cashback_cycles c 
              LEFT JOIN users u ON c.user_id = u.id 
              WHERE c.status = 'pending' 
              ORDER BY c.id DESC";
              
    $stmt = $db->prepare($query);
    $stmt->execute();
    $investments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Daily cashback rate (%) from settings — yield is computed on the GST-excluded product value.
    $dailyRate = 1.0;
    try {
        $rs = $db->query("SELECT config_value FROM platform_settings WHERE config_key = 'daily_cashback_rate'")->fetchColumn();
        if ($rs !== false && $rs !== null && $rs !== '') $dailyRate = (float)$rs;
    } catch (Exception $e) {}

    // 2. Map and clean data
    foreach ($investments as &$inv) {
        $inv['cycle_id'] = $inv['id'];
        $inv['cycle_status'] = $inv['status'];
        // Daily yield = daily_rate% of the cashback-eligible (ex-GST) product value.
        $eligible = (float)($inv['cashback_eligible_amount'] ?? 0);
        if ($eligible <= 0) $eligible = (float)($inv['product_amount'] ?? 0);
        if ($eligible <= 0) $eligible = (float)($inv['total_value'] ?? 0);
        $inv['cashback_eligible_amount'] = $eligible;
        $inv['daily_payout'] = round($eligible * $dailyRate / 100, 2);
        // Show the actual product the customer bought. Only fall back to a metal label
        // for raw gold/silver investments (which have no stored product_name).
        if ($inv['asset_type'] === 'product') {
            if (empty($inv['product_name'])) $inv['product_name'] = 'Product Purchase';
        } else {
            $inv['product_name'] = ($inv['asset_type'] === 'silver' ? 'Pure Silver' : '22K Gold') . ' Asset';
        }
        // Ensure keys exist even if columns are missing (fallback for UI)
        if (!isset($inv['transaction_id'])) $inv['transaction_id'] = 'N/A';
        if (!isset($inv['payment_screenshot'])) $inv['payment_screenshot'] = null;
    }

    echo json_encode([
        "status" => "success",
        "data" => $investments
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error", 
        "message" => "API_FATAL: " . $e->getMessage()
    ]);
}
?>
