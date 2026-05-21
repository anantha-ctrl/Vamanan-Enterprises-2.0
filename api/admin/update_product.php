<?php
// api/admin/update_product.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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

// Check if it's multipart/form-data or JSON
$contentType = $_SERVER["CONTENT_TYPE"] ?? "";

if (strpos($contentType, "multipart/form-data") !== false) {
    $id = $_POST['id'] ?? null;
    $name = $_POST['name'] ?? '';
    $category = $_POST['category'] ?? 'Gold Asset';
    $price = $_POST['price'] ?? '';
    $weight = $_POST['weight'] ?? 0;
    $purity = $_POST['purity'] ?? '24K';
    $description = $_POST['description'] ?? '';
    $is_active = $_POST['is_active'] ?? 1;
    
    $image_path = $_POST['image'] ?? null; // Keep existing if not uploading new
    
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
    $id = $data->id ?? null;
    $name = $data->name ?? '';
    $category = $data->category ?? 'Gold Asset';
    $price = $data->price ?? '';
    $weight = $data->weight ?? 0;
    $purity = $data->purity ?? '24K';
    $description = $data->description ?? '';
    $is_active = $data->is_active ?? 1;
    $image_path = $data->image ?? null;
}

if (!empty($id) && !empty($name)) {
    try {
        $query = "UPDATE products SET 
                  name = :name,
                  category = :category,
                  weight = :weight,
                  purity = :purity,
                  price = :price,
                  image = :image,
                  description = :description,
                  is_active = :is_active,
                  updated_at = NOW()
                  WHERE id = :id";

        $stmt = $db->prepare($query);
        $stmt->execute([
            'id' => $id,
            'name' => $name,
            'category' => $category,
            'weight' => $weight,
            'purity' => $purity,
            'price' => $price,
            'image' => $image_path,
            'description' => $description,
            'is_active' => $is_active
        ]);

        echo json_encode(["status" => "success", "message" => "Product updated successfully."]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Product ID and Name are required."]);
}
?>