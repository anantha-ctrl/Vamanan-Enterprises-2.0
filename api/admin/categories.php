<?php
// api/admin/categories.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once '../config/db.php';

$database = new Database();
$db = $database->getConnection();

$defaultCategories = [
    ['Gold', 'gold'],
    ['House Construction', 'house-construction'],
    ['All Construction Material', 'all-construction-material'],
    ['Electronics', 'electronics'],
    ['Vehicles (2wheeler/4wheeler)', 'vehicles-2wheeler-4wheeler'],
    ['Groceries', 'groceries']
];

try {
    $db->exec("CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $seedStmt = $db->prepare("INSERT IGNORE INTO categories (name, slug) VALUES (?, ?)");
    foreach ($defaultCategories as $category) {
        $seedStmt->execute($category);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $db->query("SELECT * FROM categories ORDER BY FIELD(slug, 'gold', 'house-construction', 'all-construction-material', 'electronics', 'vehicles-2wheeler-4wheeler', 'groceries') = 0, FIELD(slug, 'gold', 'house-construction', 'all-construction-material', 'electronics', 'vehicles-2wheeler-4wheeler', 'groceries'), name ASC");
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["status" => "success", "data" => $categories]);

} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $name = trim($data['name'] ?? '');
    if (empty($name)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Category name required"]);
        exit;
    }
    $slug = strtolower(preg_replace('/[^a-z0-9]+/', '-', strtolower($name))) . '-' . time();
    try {
        $stmt = $db->prepare("INSERT INTO categories (name, slug) VALUES (?, ?)");
        $stmt->execute([$name, $slug]);
        $id = $db->lastInsertId();
        echo json_encode(["status" => "success", "message" => "Category created", "data" => ["id" => $id, "name" => $name, "slug" => $slug]]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }

} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Category ID required"]);
        exit;
    }
    try {
        $stmt = $db->prepare("DELETE FROM categories WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["status" => "success", "message" => "Category deleted"]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}
?>
