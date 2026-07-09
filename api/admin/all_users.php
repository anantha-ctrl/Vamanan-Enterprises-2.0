<?php
// api/admin/all_users.php
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

    $query = "SELECT u.id, u.customer_id, u.referral_code, u.name, u.email, u.role, u.status, u.kyc_status, u.kyc_document, u.created_at,
                     u.referrer_id, ref.name AS referrer_name, ref.customer_id AS referrer_customer_id, ref.referral_code AS referrer_referral_code,
                     COALESCE(w.balance, 0) as balance
              FROM users u
              LEFT JOIN wallets w ON u.id = w.user_id
              LEFT JOIN users ref ON u.referrer_id = ref.id
              ORDER BY u.created_at DESC";
    $stmt = $db->query($query);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "data" => $users]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>