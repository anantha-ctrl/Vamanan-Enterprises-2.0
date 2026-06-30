<?php
// api/admin/stats.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/db.php';
require_once '../config/migrate.php';
require_once __DIR__ . '/../cron/daily_yield_engine.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    die(json_encode(["status" => "error", "message" => "Database connection failed"]));
}

// Ensure database is up to date
runMigrations($db);

// Lazy daily cron: auto-credit today's cashback (once per day) when the admin
// dashboard loads — so payouts run automatically even without an OS cron job.
maybe_run_daily_yield($db);

try {
    // 1. Total Revenue (Purchase transactions)
    $revQuery = "SELECT SUM(amount) as total FROM transactions WHERE category IN ('purchase', 'purchase_request') AND status = 'completed'";
    $revStmt = $db->query($revQuery);
    if (!$revStmt) throw new Exception("Revenue query failed");
    $revenue = $revStmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

    // 2. Total Payouts (Realized Earnings)
    $payQuery = "SELECT SUM(amount) as total FROM transactions WHERE category = 'payout' AND status = 'completed'";
    $payStmt = $db->query($payQuery);
    if (!$payStmt) throw new Exception("Payout query failed");
    $payouts = $payStmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

    // 3. Total Customers
    $userQuery = "SELECT COUNT(*) as count FROM users WHERE role = 'customer'";
    $userStmt = $db->query($userQuery);
    if (!$userStmt) throw new Exception("User query failed");
    $users = $userStmt->fetch(PDO::FETCH_ASSOC)['count'] ?? 0;

    // 4. Fraud Flags (Rejected KYC)
    $fraudQuery = "SELECT COUNT(*) as count FROM users WHERE kyc_status = 'rejected'";
    $fraudStmt = $db->query($fraudQuery);
    if (!$fraudStmt) throw new Exception("KYC query failed");
    $fraud = $fraudStmt->fetch(PDO::FETCH_ASSOC)['count'] ?? 0;
    // 5. Asset Inventory
    $goldWeightQuery = "SELECT SUM(weight) as total FROM cashback_cycles WHERE asset_type = 'gold' AND status = 'active'";
    $goldWeightStmt = $db->query($goldWeightQuery);
    if (!$goldWeightStmt) throw new Exception("Gold weight query failed");
    $totalGoldWeight = $goldWeightStmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

    $silverWeightQuery = "SELECT SUM(weight) as total FROM cashback_cycles WHERE asset_type = 'silver' AND status = 'active'";
    $silverWeightStmt = $db->query($silverWeightQuery);
    if (!$silverWeightStmt) throw new Exception("Silver weight query failed");
    $totalSilverWeight = $silverWeightStmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
    
    // --- REAL-TIME FRAUD ANALYSIS ---
    // 1. Circular Links (Detect users whose referrer is in their own downline - simplified to same-phone referrers)
    $circStmt = $db->query("SELECT COUNT(*) FROM users u1 JOIN users u2 ON u1.referrer_id = u2.id WHERE u1.phone = u2.phone AND u1.id != u2.id");
    $circularLinks = $circStmt->fetchColumn();

    // 2. IP Clusters (Detect users with duplicate phone numbers - likely same user)
    $clusterStmt = $db->query("SELECT COUNT(*) FROM (SELECT phone FROM users GROUP BY phone HAVING COUNT(phone) > 1) as clusters");
    $ipClusters = $clusterStmt->fetchColumn();

    // 3. Node Velocity (Users joined in last 24 hours)
    $velocityStmt = $db->query("SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL 1 DAY");
    $nodeVelocity = $velocityStmt->fetchColumn();

    // 6. Revenue Growth (Last 7 Days)
    $revenueHistory = [];
    for($i = 6; $i >= 0; $i--) {
        $date = date('Y-m-d', strtotime("-$i days"));
        $q = "SELECT SUM(amount) as total FROM transactions WHERE category IN ('purchase', 'purchase_request') AND status = 'completed' AND DATE(created_at) = '$date'";
        $s = $db->query($q);
        $revenueHistory[] = [
            "date" => date('D', strtotime($date)),
            "amount" => $s->fetch(PDO::FETCH_ASSOC)['total'] ?? 0
        ];
    }

    // 7. User Growth (Last 7 Days)
    $userHistory = [];
    for($i = 6; $i >= 0; $i--) {
        $date = date('Y-m-d', strtotime("-$i days"));
        $q = "SELECT COUNT(*) as count FROM users WHERE role = 'customer' AND DATE(created_at) = '$date'";
        $s = $db->query($q);
        $userHistory[] = [
            "date" => date('D', strtotime($date)),
            "count" => $s->fetch(PDO::FETCH_ASSOC)['count'] ?? 0
        ];
    }

    // --- NEW: Level-wise Commission Distribution ---
    $levelStats = [];
    for($l = 1; $l <= 5; $l++) {
        $q = "SELECT SUM(amount) as total FROM transactions WHERE category = 'referral' AND description LIKE '%L$l%' AND status = 'completed'";
        $s = $db->query($q);
        $levelStats["L$l"] = (float)($s->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);
    }

    // --- NEW: Top 5 Referrers ---
    $topReferrers = [];
    $topQ = "
        SELECT u.name, u.referral_code, COUNT(r.id) as referrals, COALESCE(SUM(t.amount), 0) as earnings
        FROM users u
        LEFT JOIN users r ON u.id = r.referrer_id
        LEFT JOIN wallets w ON u.id = w.user_id
        LEFT JOIN transactions t ON w.id = t.wallet_id AND t.category = 'referral'
        WHERE u.role = 'customer'
        GROUP BY u.id
        HAVING referrals > 0
        ORDER BY referrals DESC, earnings DESC
        LIMIT 5
    ";
    $topStmt = $db->query($topQ);
    $topReferrers = $topStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => [
            "revenue" => number_format($revenue, 2, '.', ''),
            "payouts" => number_format($payouts, 2, '.', ''),
            "users" => $users,
            "fraud" => $fraud,
            "circular_links" => (int)$circularLinks,
            "ip_clusters" => (int)$ipClusters,
            "node_velocity" => (int)$nodeVelocity,
            "total_gold_weight" => (float)$totalGoldWeight,
            "total_silver_weight" => (float)$totalSilverWeight,
            "revenue_history" => $revenueHistory,
            "user_history" => $userHistory,
            "level_distribution" => $levelStats,
            "top_referrers" => $topReferrers
        ]
    ]);


} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
