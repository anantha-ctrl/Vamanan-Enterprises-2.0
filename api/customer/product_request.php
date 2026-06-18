<?php
// api/customer/product_request.php
// Customer "Request a Product" — submit & fetch. Persists to the makkal_gold MySQL database.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config.php';
$db = $pdo;

// --- Self-Healing Table Schema ---
$db->exec("CREATE TABLE IF NOT EXISTS product_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    customer_name VARCHAR(255),
    customer_code VARCHAR(50),
    customer_email VARCHAR(255),
    phone VARCHAR(20),
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Gold',
    quantity INT DEFAULT 1,
    weight DECIMAL(10,3) DEFAULT 0,
    expected_price DECIMAL(15,2) DEFAULT 0,
    description TEXT,
    status ENUM('pending','reviewing','approved','rejected','fulfilled') DEFAULT 'pending',
    admin_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)");

// Safe migration: product model selected from the catalogue
try { $db->exec("ALTER TABLE product_requests ADD COLUMN model VARCHAR(255) AFTER product_name"); } catch (PDOException $e) {}

/* ----------------------------- GET (prefill + list) ----------------------------- */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $userId = $_GET['user_id'] ?? null;
    if (!$userId) {
        echo json_encode(["status" => "error", "message" => "User ID required"]);
        exit;
    }

    try {
        // Real-time customer identity straight from the users table
        $stmt = $db->prepare("SELECT id, customer_id, name, email, phone FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $u = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$u) {
            echo json_encode(["status" => "error", "message" => "User not found"]);
            exit;
        }

        // This customer's previously submitted requests (live)
        $reqStmt = $db->prepare("SELECT * FROM product_requests WHERE user_id = ? ORDER BY id DESC");
        $reqStmt->execute([$userId]);
        $requests = $reqStmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "status" => "success",
            "data" => [
                "user"     => $u,
                "requests" => $requests
            ]
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

/* ----------------------------- POST (submit) ----------------------------- */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data) $data = $_POST;

    $userId = $data['user_id'] ?? null;
    if (!$userId) {
        echo json_encode(["status" => "error", "message" => "User ID required"]);
        exit;
    }

    if (empty($data['product_name'])) {
        echo json_encode(["status" => "error", "message" => "Product name is required."]);
        exit;
    }

    try {
        $stmt = $db->prepare("INSERT INTO product_requests
            (user_id, customer_name, customer_code, customer_email, phone,
             product_name, model, category, quantity, weight, expected_price, description)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");

        $stmt->execute([
            $userId,
            $data['customer_name']  ?? '',
            $data['customer_code']  ?? '',
            $data['customer_email'] ?? '',
            $data['phone']          ?? '',
            $data['product_name'],
            $data['model']          ?? '',
            $data['category']       ?? 'Gold',
            (int)($data['quantity'] ?? 1),
            (float)($data['weight'] ?? 0),
            (float)($data['expected_price'] ?? 0),
            $data['description']    ?? ''
        ]);

        echo json_encode([
            "status"     => "success",
            "message"    => "Product request submitted successfully. Our team will review it shortly.",
            "request_id" => $db->lastInsertId()
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

echo json_encode(["status" => "error", "message" => "Method not allowed"]);
?>
