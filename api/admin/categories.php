<?php
// api/admin/categories.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once '../config/db.php';

$database = new Database();
$db = $database->getConnection();

try {
    // Ensure table exists
    $db->exec("CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // Insert default category if empty
    $check = $db->query("SELECT id FROM categories LIMIT 1");
    if ($check->rowCount() === 0) {
        $db->exec("INSERT INTO categories (name, slug) VALUES ('Gold Coins', 'gold-coins'), ('Gold Bars', 'gold-bars'), ('Jewellery', 'jewellery')");
    }

    $query = "SELECT * FROM categories ORDER BY name ASC";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // If still empty (e.g. insert failed), return hardcoded defaults
    if (empty($categories)) {
        $categories = [
            ['id' => 1, 'name' => 'Gold Coins', 'slug' => 'gold-coins'],
            ['id' => 2, 'name' => 'Gold Bars', 'slug' => 'gold-bars'],
            ['id' => 3, 'name' => 'Jewellery', 'slug' => 'jewellery']
        ];
    }

    echo json_encode(["status" => "success", "data" => $categories]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
