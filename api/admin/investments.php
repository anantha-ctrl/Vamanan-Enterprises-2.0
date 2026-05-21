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

    // 2. Map and clean data
    foreach ($investments as &$inv) {
        $inv['cycle_id'] = $inv['id'];
        $inv['cycle_status'] = $inv['status'];
        $inv['product_name'] = ($inv['asset_type'] === 'silver' ? 'Pure Silver' : '22K Gold') . ' Asset';
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
