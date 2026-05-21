<?php
// api/admin/products.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once '../config/db.php';
require_once '../config/migrate.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    die(json_encode(["status" => "error", "message" => "Database connection failed"]));
}

// Ensure database is up to date
runMigrations($db);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $query = "SELECT * FROM products ORDER BY id DESC";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(["status" => "success", "data" => $products]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    // Check if it's multipart/form-data or JSON
    $contentType = $_SERVER["CONTENT_TYPE"] ?? "";
    
    if (strpos($contentType, "multipart/form-data") !== false) {
        $name = $_POST['name'] ?? '';
        $category = $_POST['category'] ?? 'Gold Asset';
        $price = $_POST['price'] ?? '';
        $weight = $_POST['weight'] ?? 0;
        $purity = $_POST['purity'] ?? '24K';
        $description = $_POST['description'] ?? '';
        $is_active = $_POST['is_active'] ?? 1;
        
        $image_path = null;
        
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $upload_dir = '../uploads/products/';
            if (!is_dir($upload_dir)) {
                mkdir($upload_dir, 0777, true);
            }
            
            $file_extension = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
            $file_name = time() . '_' . uniqid() . '.' . $file_extension;
            $target_file = $upload_dir . $file_name;
            
            if (move_uploaded_file($_FILES['image']['tmp_name'], $target_file)) {
                $image_path = 'api/uploads/products/' . $file_name;
            }
        }
    } else {
        $data = json_decode(file_get_contents("php://input"));
        $name = $data->name ?? '';
        $category = $data->category ?? 'Gold Asset';
        $price = $data->price ?? '';
        $weight = $data->weight ?? 0;
        $purity = $data->purity ?? '24K';
        $description = $data->description ?? '';
        $is_active = $data->is_active ?? 1;
        $image_path = $data->image ?? null;
    }

    if (!empty($name) && !empty($price)) {
        try {
            $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $name)));

            $query = "INSERT INTO products (name, category, slug, weight, purity, price, image, description, is_active, created_at, updated_at) 
                      VALUES (:name, :category, :slug, :weight, :purity, :price, :image, :description, :is_active, NOW(), NOW())";

            $stmt = $db->prepare($query);
            $stmt->execute([
                'name' => $name,
                'category' => $category,
                'slug' => $slug . '-' . time(),
                'weight' => $weight,
                'purity' => $purity,
                'price' => $price,
                'image' => $image_path,
                'description' => $description,
                'is_active' => $is_active
            ]);

            echo json_encode(["status" => "success", "message" => "Product added successfully."]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Required fields missing."]);
    }
}
?>