<?php
// api/admin/update_permissions.php
// Manually update a staff member's permission-based access (and optionally role).
// POST JSON: { user_id, permissions: [...], role? }
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

require_once '../config.php';
$db = $pdo;

$data = json_decode(file_get_contents("php://input"), true) ?: [];
$userId = isset($data['user_id']) ? (int)$data['user_id'] : 0;

if (!$userId) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "user_id is required"]);
    exit;
}

// Permissions must be a clean array of string ids.
$permissions = $data['permissions'] ?? [];
if (!is_array($permissions)) $permissions = [];
$permissions = array_values(array_unique(array_filter(array_map(
    fn($p) => is_string($p) ? trim($p) : '',
    $permissions
), fn($p) => $p !== '')));

try {
    // Only management roles carry permissions — never customers/admins via this endpoint.
    $chk = $db->prepare("SELECT id, role FROM users WHERE id = ?");
    $chk->execute([$userId]);
    $u = $chk->fetch(PDO::FETCH_ASSOC);
    if (!$u) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "User not found"]);
        exit;
    }
    if ($u['role'] === 'admin') {
        echo json_encode(["status" => "error", "message" => "Admin permissions cannot be edited."]);
        exit;
    }

    $fields = "permissions = :perms";
    $params = ['perms' => json_encode($permissions), 'id' => $userId];

    // Optional role change (management roles only).
    if (isset($data['role'])) {
        $role = strtolower(trim((string)$data['role']));
        if (in_array($role, ['manager', 'staff', 'advocate'], true)) {
            $fields .= ", role = :role";
            $params['role'] = $role;
        }
    }

    $db->prepare("UPDATE users SET $fields WHERE id = :id")->execute($params);

    echo json_encode([
        "status"  => "success",
        "message" => "Access permissions updated.",
        "user_id" => $userId,
        "permissions" => $permissions,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
