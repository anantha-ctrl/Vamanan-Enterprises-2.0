<?php
// api/admin/get_genealogy.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

date_default_timezone_set('Asia/Kolkata');

require_once '../config/db.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $userId = $_GET['user_id'] ?? null;
    
    // If no user_id, start from top-level users (those without referrers)
    // or just require a user_id for searching.
    if (!$userId) {
        // Fetch top-level users (seeders)
        $stmt = $db->prepare("SELECT id, name, email, referral_code, created_at, kyc_status FROM users WHERE referrer_id IS NULL OR referrer_id = 0 LIMIT 20");
        $stmt->execute();
        $topUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach($topUsers as &$u) {
            $u['is_root'] = true;
        }
        
        echo json_encode([
            "status" => "success",
            "message" => "Root users fetched. Select a user to view their tree.",
            "data" => $topUsers
        ]);
        exit;
    }

    function getFullGenealogy($db, $parentId, $level = 1) {
        if ($level > 5) return []; // Limit to 5 levels as per request

        $stmt = $db->prepare("
            SELECT id, name, email, referral_code, created_at, kyc_status, phone
            FROM users 
            WHERE referrer_id = ?
        ");
        $stmt->execute([$parentId]);
        $children = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($children as &$child) {
            // Stats for Admin
            $invStmt = $db->prepare("SELECT SUM(total_value) as total_inv, SUM(paid_amount) as total_paid FROM cashback_cycles WHERE user_id = ?");
            $invStmt->execute([$child['id']]);
            $stats = $invStmt->fetch(PDO::FETCH_ASSOC);
            
            $child['total_investment'] = (float)($stats['total_inv'] ?? 0);
            $child['total_earned']     = (float)($stats['total_paid'] ?? 0);
            $child['level']            = $level;
            
            // Recursive call
            $child['downline'] = getFullGenealogy($db, $child['id'], $level + 1);
        }

        return $children;
    }

    $tree = getFullGenealogy($db, $userId);

    echo json_encode([
        "status" => "success",
        "data" => $tree
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
