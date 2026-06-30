<?php
// api/customer/get_genealogy.php
//
// REFERRAL GENEALOGY (DOWNLINE HIERARCHY + RECENCY RANKING)
// --------------------------------------------------------
// Returns the viewing user's network in two shapes:
//
//   data : a flat, recency-ranked list (newest member = L1, you = deepest level).
//          Kept for backward compatibility with any list-style consumers.
//
//   tree : a nested parent -> child hierarchy rooted at the viewing user (YOU on
//          top). Each node carries its direct referrals in `children`, so the
//          frontend can draw a real top-down org-chart. Children are ordered
//          newest-first. The single most-recently-joined member is flagged
//          `is_newest` and exposed separately as `newest_id`.
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
    $userId = (int)$userId;

    // 1. Collect the whole subtree (all descendants) of this user, keeping the
    //    referrer linkage so we can rebuild the hierarchy. A visited-set guards
    //    against circular referrer links.
    $visited = [];
    $members = [];

    $collect = function ($parentId) use (&$collect, $db, &$members, &$visited) {
        $stmt = $db->prepare("
            SELECT id, name, email, referral_code, referrer_id, created_at, kyc_status
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
        SELECT id, name, email, referral_code, referrer_id, created_at, kyc_status
        FROM users
        WHERE id = ?
    ");
    $rootStmt->execute([$userId]);
    $root = $rootStmt->fetch(PDO::FETCH_ASSOC);
    if (!$root) {
        throw new Exception("User not found");
    }
    $root['is_you'] = true;
    $members[] = $root;

    // 3. Live investment total per member (active cashback cycles).
    $invStmt = $db->prepare("SELECT COALESCE(SUM(total_value),0) FROM cashback_cycles WHERE user_id = ? AND status = 'active'");

    // 4. Determine the single newest-joined member (excluding YOU). This is the
    //    node highlighted as "Newest" in the tree.
    $newestId = null;
    $newestTs = null;
    foreach ($members as $m) {
        if ((int)$m['id'] === $userId) continue;          // skip the root/you
        $ts = strtotime((string)$m['created_at']);
        if ($newestTs === null || $ts > $newestTs || ($ts === $newestTs && (int)$m['id'] > (int)$newestId)) {
            $newestTs = $ts;
            $newestId = (int)$m['id'];
        }
    }

    // 5. Normalise every member into a node map keyed by id.
    $nodes = [];
    foreach ($members as $m) {
        $id = (int)$m['id'];
        $invStmt->execute([$id]);
        $nodes[$id] = [
            'id'               => $id,
            'name'             => $m['name'],
            'referral_code'    => $m['referral_code'],
            'created_at'       => $m['created_at'],
            'kyc_status'       => $m['kyc_status'],
            'referrer_id'      => $m['referrer_id'] !== null ? (int)$m['referrer_id'] : null,
            'is_you'           => ($id === $userId),
            'is_newest'        => ($id === $newestId),
            'total_investment' => (float)$invStmt->fetchColumn(),
        ];
    }

    // 6. Build the child index (parent id -> [child ids]).
    $childrenMap = [];
    foreach ($nodes as $id => $n) {
        if ($id === $userId) continue;                    // root has no parent here
        $pid = $n['referrer_id'];
        if ($pid !== null && isset($nodes[$pid])) {
            $childrenMap[$pid][] = $id;
        }
    }

    // 7. Recursively assemble the nested tree, ordering children newest-first.
    $build = function ($id) use (&$build, $nodes, $childrenMap) {
        $node = $nodes[$id];
        unset($node['referrer_id']);
        $kids = $childrenMap[$id] ?? [];
        usort($kids, function ($a, $b) use ($nodes) {
            $c = strcmp((string)$nodes[$b]['created_at'], (string)$nodes[$a]['created_at']);
            return $c !== 0 ? $c : ($b - $a);
        });
        $node['children'] = array_map($build, $kids);
        return $node;
    };
    $tree = $build($userId);

    // 8. Flat recency-ranked list (newest first) — preserved for compatibility.
    $flat = array_values($nodes);
    usort($flat, function ($a, $b) {
        $cmp = strcmp((string)$b['created_at'], (string)$a['created_at']);
        if ($cmp !== 0) return $cmp;
        return (int)$b['id'] - (int)$a['id'];
    });
    foreach ($flat as $i => &$m) {
        $m['level'] = $i + 1;                              // L1 = newest
        $m['is_newest'] = ($i === 0);
        unset($m['referrer_id']);
    }
    unset($m);

    echo json_encode([
        "status"        => "success",
        "total_members" => count($nodes),
        "newest_id"     => $newestId,
        "data"          => $flat,
        "tree"          => $tree,
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
