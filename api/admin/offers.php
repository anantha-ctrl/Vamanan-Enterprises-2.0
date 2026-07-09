<?php
// api/admin/offers.php
//   GET                        -> list ALL offers (admin management)
//   POST {action:'create',...} -> create an offer
//   POST {action:'toggle', id} -> flip is_active
//   POST {action:'delete', id} -> delete
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once '../config.php';

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $offers = $pdo->query("SELECT * FROM offers ORDER BY created_at DESC")->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["status" => "success", "data" => $offers]);
        exit;
    }

    $data   = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? 'create';

    if ($action === 'toggle') {
        $id = (int)($data['id'] ?? 0);
        $pdo->prepare("UPDATE offers SET is_active = 1 - is_active WHERE id = ?")->execute([$id]);
        echo json_encode(["status" => "success", "message" => "Offer status updated"]);
        exit;
    }

    if ($action === 'delete') {
        $id = (int)($data['id'] ?? 0);
        $pdo->prepare("DELETE FROM offers WHERE id = ?")->execute([$id]);
        echo json_encode(["status" => "success", "message" => "Offer deleted"]);
        exit;
    }

    // create
    $title   = trim($data['title'] ?? '');
    $message = trim($data['message'] ?? '');
    $badge   = trim($data['badge'] ?? 'OFFER');
    $color   = trim($data['color'] ?? 'blue');   // blue | amber | emerald | red | purple
    $image   = trim($data['image'] ?? '');
    $starts  = !empty($data['starts_at']) ? $data['starts_at'] : null;
    $ends    = !empty($data['ends_at']) ? $data['ends_at'] : null;

    if ($title === '') {
        echo json_encode(["status" => "error", "message" => "Title is required"]);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO offers (title, message, image, badge, color, is_active, starts_at, ends_at)
                           VALUES (?, ?, ?, ?, ?, 1, ?, ?)");
    $stmt->execute([$title, $message, $image ?: null, $badge, $color, $starts, $ends]);

    echo json_encode(["status" => "success", "message" => "Offer published", "id" => $pdo->lastInsertId()]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
