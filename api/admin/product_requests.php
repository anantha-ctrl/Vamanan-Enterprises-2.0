<?php
// api/admin/product_requests.php
// Admin view of customer product requests. GET = list all, POST = update status/note.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

require_once '../config.php';
$db = $pdo;

// Self-healing: ensure the table exists even if no customer has submitted yet.
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)");
try { $db->exec("ALTER TABLE product_requests ADD COLUMN model VARCHAR(255) AFTER product_name"); } catch (PDOException $e) {}

try {
    /* ----------------------------- POST (update status) ----------------------------- */
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!is_array($data)) $data = $_POST;

        $id = $data['id'] ?? null;
        $status = $data['status'] ?? null;
        $allowed = ['pending', 'reviewing', 'approved', 'rejected', 'fulfilled'];

        if (!$id || !in_array($status, $allowed, true)) {
            echo json_encode(["status" => "error", "message" => "Valid request id and status are required."]);
            exit;
        }

        $stmt = $db->prepare("UPDATE product_requests SET status = ?, admin_note = ? WHERE id = ?");
        $stmt->execute([$status, $data['admin_note'] ?? null, $id]);

        echo json_encode(["status" => "success", "message" => "Product request updated."]);
        exit;
    }

    /* ----------------------------- GET (list all) ----------------------------- */
    $stmt = $db->query("SELECT pr.*, u.customer_id AS user_customer_id, u.name AS user_name, u.email AS user_email
                        FROM product_requests pr
                        LEFT JOIN users u ON pr.user_id = u.id
                        ORDER BY pr.id DESC");
    $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "data" => $requests]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
