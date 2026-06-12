<?php
// api/customer/get_genealogy.php
//
// RECENCY-RANKED GENEALOGY
// ------------------------
// Unlike a classic downline tree (direct child = L1), this view ranks every
// member of the network by how recently they joined. The most recently referred
// member is ALWAYS Level 1, and everyone who came before shifts down one level.
// The viewing user (the root) is included too, and — being the oldest — always
// sits at the deepest level.
//
// Example chain  Jessica -> Kavin -> Muthu
//   After Kavin joins :  Kavin L1, Jessica L2
//   After Muthu joins :  Muthu L1, Kavin L2, Jessica L3
//
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

date_default_timezone_set('Asia/Kolkata');

require_once '../config.php';
$db = $pdo;

try {
    $userId = $_GET['user_id'] ?? null;
    if (!$userId) {
        throw new Exception("User ID is required");
    }

    // 1. Collect the whole subtree (all descendants) of this user.
    //    A visited-set guards against circular referrer links.
    $visited = [];
    $members = [];

    $collect = function ($parentId) use (&$collect, $db, &$members, &$visited) {
        $stmt = $db->prepare("
            SELECT id, name, email, referral_code, created_at, kyc_status
            FROM users
            WHERE referrer_id = ?
        ");
        $stmt->execute([$parentId]);
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $child) {
            if (isset($visited[$child['id']])) continue; // cycle guard
            $visited[$child['id']] = true;
            $members[] = $child;
            $collect($child['id']);
        }
    };
    $collect($userId);

    // 2. Include the viewing user themselves (the root of this network).
    $rootStmt = $db->prepare("
        SELECT id, name, email, referral_code, created_at, kyc_status
        FROM users
        WHERE id = ?
    ");
    $rootStmt->execute([$userId]);
    $root = $rootStmt->fetch(PDO::FETCH_ASSOC);
    if ($root) {
        $root['is_you'] = true;
        $members[] = $root;
    }

    // 3. Rank by recency — newest first (ties broken by id so order is stable).
    usort($members, function ($a, $b) {
        $cmp = strcmp((string)$b['created_at'], (string)$a['created_at']);
        if ($cmp !== 0) return $cmp;
        return (int)$b['id'] - (int)$a['id'];
    });

    // 4. Assign levels (newest = L1) and attach live investment totals.
    $invStmt = $db->prepare("SELECT COALESCE(SUM(total_value),0) FROM cashback_cycles WHERE user_id = ? AND status = 'active'");
    foreach ($members as $i => &$m) {
        $m['level'] = $i + 1;                       // L1 = newest
        $m['is_newest'] = ($i === 0);               // top of the tree
        $m['is_you'] = !empty($m['is_you']);
        $invStmt->execute([$m['id']]);
        $m['total_investment'] = (float)$invStmt->fetchColumn();
    }
    unset($m);

    echo json_encode([
        "status" => "success",
        "total_members" => count($members),
        "data" => $members,
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
