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
    $stmt = $db->query("SELECT id, name, email, kyc_status, kyc_document, created_at FROM users WHERE role = 'customer' ORDER BY created_at DESC");
    $kyc = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Fetch Disputes
    $stmt = $db->query("SELECT d.*, u.name as user_name FROM disputes d JOIN users u ON d.user_id = u.id ORDER BY d.created_at DESC");
    $disputes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 4. Fetch Recent Activities (Live Feed)
    $stmt = $db->query("SELECT l.*, u.name as user_name FROM activity_logs l JOIN users u ON l.user_id = u.id ORDER BY l.created_at DESC LIMIT 5");
    $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 5. Calculate Stats
    $stats = [
        "active_members" => count(array_filter($kyc, function($u) { return $u['kyc_status'] === 'verified'; })),
        "pending_agreements" => count(array_filter($agreements, function($a) { return $a['status'] === 'pending'; })),
        "active_agreements" => count(array_filter($agreements, function($a) { return $a['status'] === 'verified'; })),
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
            "stats" => $stats
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Fetch failed: " . $e->getMessage()]);
}
?>
