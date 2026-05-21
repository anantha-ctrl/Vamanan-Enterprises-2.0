<?php
// api/manager/stats.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/db.php';
require_once '../config/migrate.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

// Ensure database is up to date
runMigrations($db);

try {
    // 1. Revenue & Cashback Stats
    $goldPrice = 0;
    try {
        $priceStmt = $db->query("SELECT price FROM products WHERE slug = 'gold' OR name LIKE '%Gold%' LIMIT 1");
        $priceResult = $priceStmt->fetch(PDO::FETCH_ASSOC);
        if ($priceResult) $goldPrice = $priceResult['price'];
    } catch (Exception $e) {}

    $revenue = ["total_revenue" => 0, "total_cashback" => 0, "active_investments" => 0, "total_volume" => 0];
    try {
        $revStmt = $db->query("SELECT 
            (SELECT SUM(amount) FROM transactions WHERE category = 'purchase' AND status = 'completed') as total_revenue,
            (SELECT SUM(amount) FROM transactions WHERE category = 'payout' AND status = 'completed') as total_cashback,
            (SELECT COUNT(*) FROM cashback_cycles WHERE status = 'active') as active_investments,
            (SELECT SUM(total_value) FROM cashback_cycles WHERE status = 'active') as total_volume");
        $revenueResult = $revStmt->fetch(PDO::FETCH_ASSOC);
        if ($revenueResult) $revenue = $revenueResult;
    } catch (Exception $e) {}

    // 2. User Stats
    $userStats = ["total_users" => 0, "verified_users" => 0, "pending_kyc" => 0];
    try {
        $userStmt = $db->query("SELECT 
            COUNT(*) as total_users,
            COUNT(CASE WHEN kyc_status = 'verified' THEN 1 END) as verified_users,
            COUNT(CASE WHEN kyc_status = 'pending' THEN 1 END) as pending_kyc
            FROM users WHERE role = 'customer'");
        $userResult = $userStmt->fetch(PDO::FETCH_ASSOC);
        if ($userResult) $userStats = $userResult;
    } catch (Exception $e) {}

    // 3. Withdrawal Stats
    $withdrawalStats = ["pending_withdrawals" => 0, "total_withdrawn" => 0];
    try {
        $withdrawStmt = $db->query("SELECT 
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_withdrawals,
            SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as total_withdrawn
            FROM withdrawals");
        $withdrawResult = $withdrawStmt->fetch(PDO::FETCH_ASSOC);
        if ($withdrawResult) $withdrawalStats = $withdrawResult;
    } catch (Exception $e) {}

    // 4. Detailed Withdrawal List for Dashboard
    $withdrawalsList = [];
    try {
        $wListStmt = $db->query("SELECT w.*, u.name as user_name FROM withdrawals w JOIN users u ON w.user_id = u.id ORDER BY w.created_at DESC");
        $withdrawalsList = $wListStmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {}

    // 5. Detailed KYC Pending List
    $kycPendingList = [];
    try {
        $kycStmt = $db->query("SELECT id, name, email, kyc_document, bank_name, account_no, ifsc_code, branch_name, phone, address, aadhar_no, pan_no, created_at FROM users WHERE kyc_status = 'pending' ORDER BY created_at DESC");
        $kycPendingList = $kycStmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {}

    // 6. All Users List (Filter for customers only for the Investor Directory)
    $allUsersList = [];
    try {
        $usersListStmt = $db->query("SELECT u.id, u.name, u.email, u.role, u.status, u.kyc_status, u.kyc_document, 
                                            u.bank_name, u.account_no, u.ifsc_code, u.branch_name, u.phone, u.address, u.aadhar_no, u.pan_no,
                                            u.created_at, 
                                            COALESCE(w.balance, 0) as balance 
                                     FROM users u 
                                     LEFT JOIN wallets w ON u.id = w.user_id 
                                     WHERE u.role = 'customer'
                                     ORDER BY u.created_at DESC");
        $allUsersList = $usersListStmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {}

    // 7. Growth Data (Last 7 Days)
    $growthData = [];
    try {
        $growthStmt = $db->query("SELECT DATE(created_at) as date, COUNT(*) as count 
                                  FROM users 
                                  WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                                  GROUP BY DATE(created_at)
                                  ORDER BY date ASC");
        $growthData = $growthStmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {}

    // 9. Pending Investments List
    $pendingInvestmentsList = [];
    try {
        $pendingInvStmt = $db->query("SELECT c.*, u.name as user_name, u.email as user_email 
                                      FROM cashback_cycles c 
                                      JOIN users u ON c.user_id = u.id 
                                      WHERE c.status = 'pending' 
                                      ORDER BY c.created_at DESC");
        $pendingInvestmentsList = $pendingInvStmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {}

    // 10. Activity Logs
    $activityLogs = [];
    try {
        $logStmt = $db->query("SELECT l.*, u.name as user_name FROM activity_logs l JOIN users u ON l.user_id = u.id ORDER BY l.created_at DESC LIMIT 10");
        $activityLogs = $logStmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {}

    echo json_encode([
        "status" => "success",
        "data" => [
            "revenue" => [
                "total" => $revenue['total_revenue'] ?? 0,
                "cashback" => $revenue['total_cashback'] ?? 0,
                "active_investments" => $revenue['active_investments'] ?? 0,
                "total_volume" => $revenue['total_volume'] ?? 0
            ],
            "users" => [
                "total" => $userStats['total_users'] ?? 0,
                "verified" => $userStats['verified_users'] ?? 0,
                "active_rate" => ($userStats['total_users'] ?? 0) > 0 ? round(($userStats['verified_users'] / $userStats['total_users']) * 100) : 0
            ],
            "withdrawals_stats" => [
                "pending_count" => $withdrawalStats['pending_withdrawals'] ?? 0,
                "total_paid" => $withdrawalStats['total_withdrawn'] ?? 0
            ],
            "withdrawals" => $withdrawalsList,
            "kyc_pending" => $kycPendingList,
            "all_users" => $allUsersList,
            "investments" => $pendingInvestmentsList,
            "growth" => $growthData,
            "logs" => $activityLogs,
            "liveGoldPrice" => $goldPrice
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
