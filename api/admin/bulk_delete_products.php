<?php
// api/admin/bulk_delete_products.php
// Deletes multiple products at once from the makkal_gold MySQL DB.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

require_once '../config.php';
$db = $pdo;

$data = json_decode(file_get_contents("php://input"), true);
$ids = $data['ids'] ?? null;

if (!is_array($ids) || count($ids) === 0) {
    echo json_encode(["status" => "error", "message" => "No product IDs provided."]);
    exit;
}

// Keep only positive integers
$ids = array_values(array_unique(array_filter(array_map('intval', $ids), fn($v) => $v > 0)));
if (count($ids) === 0) {
    echo json_encode(["status" => "error", "message" => "No valid product IDs provided."]);
    exit;
}

try {
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $db->prepare("DELETE FROM products WHERE id IN ($placeholders)");
    $stmt->execute($ids);

    echo json_encode([
        "status"  => "success",
        "message" => $stmt->rowCount() . " product(s) deleted successfully.",
        "deleted" => $stmt->rowCount(),
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
