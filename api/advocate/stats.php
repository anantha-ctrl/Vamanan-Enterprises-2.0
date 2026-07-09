<?php
// api/advocate/stats.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../config/db.php';
require_once '../config/migrate.php';

$database = new Database();
$db = $database->getConnection();

// Ensure database is up to date
runMigrations($db);

try {
    // 1. Fetch Agreements (Full Legal Context)
    $stmt = $db->query("SELECT a.*, u.name as user_name, u.email as user_email, u.aadhar_no, u.pan_no, p.name as product_name, p.price, p.weight 
                        FROM agreements a 
                        JOIN users u ON a.user_id = u.id 
                        LEFT JOIN products p ON a.product_id = p.id 
                        ORDER BY a.created_at DESC");
    $agreements = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. Fetch All Customers (Institutional Registry)
    $stmt = $db->query("SELECT id, customer_id, name, email, phone, kyc_status, kyc_document, created_at FROM users WHERE role = 'customer' ORDER BY created_at DESC");
    $kyc = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Fetch Disputes
    $stmt = $db->query("SELECT d.*, u.name as user_name FROM disputes d JOIN users u ON d.user_id = u.id ORDER BY d.created_at DESC");
    $disputes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 4. Fetch Recent Activities (Live Feed)
    $stmt = $db->query("SELECT l.*, u.name as user_name FROM activity_logs l JOIN users u ON l.user_id = u.id ORDER BY l.created_at DESC LIMIT 5");
    $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 4b. Fetch All Purchases (Cycles)
    $query = "SELECT c.*, u.name as user_name, u.email as user_email, u.phone as user_phone, u.aadhar_no, u.pan_no 
              FROM cashback_cycles c 
              LEFT JOIN users u ON c.user_id = u.id 
              ORDER BY c.id DESC";
              
    $stmt = $db->prepare($query);
    $stmt->execute();
    $purchases = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Daily cashback rate (%) from settings
    $dailyRate = 1.0;
    try {
        $rs = $db->query("SELECT config_value FROM platform_settings WHERE config_key = 'daily_cashback_rate'")->fetchColumn();
        if ($rs !== false && $rs !== null && $rs !== '') $dailyRate = (float)$rs;
    } catch (Exception $e) {}

    // Enrich and clean up purchases
    foreach ($purchases as &$p) {
        $p['cycle_id'] = $p['id'];
        $p['cycle_status'] = $p['status'];
        
        $eligible = (float)($p['cashback_eligible_amount'] ?? 0);
        if ($eligible <= 0) $eligible = (float)($p['product_amount'] ?? 0);
        if ($eligible <= 0) $eligible = (float)($p['total_value'] ?? 0);
        $p['cashback_eligible_amount'] = $p['cashback_eligible_amount'] ?? $eligible;
        $p['daily_payout'] = round($eligible * $dailyRate / 100, 2);
        
        if ($p['asset_type'] === 'product') {
            if (empty($p['product_name'])) $p['product_name'] = 'Product Purchase';
        } else {
            $p['product_name'] = ($p['asset_type'] === 'silver' ? 'Pure Silver' : '22K Gold') . ' Asset';
        }
        if (!isset($p['transaction_id'])) $p['transaction_id'] = 'N/A';
        if (!isset($p['payment_screenshot'])) $p['payment_screenshot'] = null;
    }

    // 5. Calculate Stats
    $stats = [
        "active_members" => count(array_filter($kyc, function($u) { return $u['kyc_status'] === 'verified'; })),
        "pending_agreements" => count(array_filter($agreements, function($a) { return $a['status'] === 'verified'; })),
        "active_agreements" => count(array_filter($agreements, function($a) { return $a['status'] === 'ratified' || $a['status'] === 'active'; })),
        "active_disputes" => count(array_filter($disputes, function($d) { return $d['status'] === 'open' || $d['status'] === 'in_resolution'; })),
        "compliance_score" => "99.2%",
        "total_docs" => count($agreements) + count($kyc)
    ];

    echo json_encode([
        "status" => "success",
        "data" => [
            "agreements" => $agreements,
            "kyc_pending" => $kyc,
            "disputes" => $disputes,
            "activities" => $activities,
            "purchases" => $purchases,
            "stats" => $stats
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Fetch failed: " . $e->getMessage()]);
}
?>
