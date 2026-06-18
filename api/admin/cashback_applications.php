<?php
// api/admin/cashback_applications.php
// Lists all cashback applications (JSON) for the admin Tally panel + summary totals.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once '../config.php';
$db = $pdo;

// Self-healing table (same schema as customer/cashback_application.php)
$db->exec("CREATE TABLE IF NOT EXISTS cashback_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    customer_name VARCHAR(255),
    address TEXT,
    phone VARCHAR(20),
    aadhar_no VARCHAR(20),
    pan_no VARCHAR(20),
    customer_code VARCHAR(50),
    customer_email VARCHAR(255),
    referral_id VARCHAR(50),
    purchase_amount DECIMAL(15,2) DEFAULT 0,
    purchased_product VARCHAR(255),
    product_details TEXT,
    purchase_date DATE NULL,
    bank_account_name VARCHAR(255),
    account_no VARCHAR(50),
    ifsc_code VARCHAR(20),
    bank_name VARCHAR(255),
    bank_branch VARCHAR(255),
    agent_name VARCHAR(255),
    agent_id VARCHAR(50),
    place VARCHAR(255) DEFAULT 'Krishnagiri',
    application_date DATE NULL,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

// Update an application's status (approve / reject)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!is_array($data)) $data = $_POST;
    $id = $data['id'] ?? null;
    $status = $data['status'] ?? null;
    $allowed = ['pending', 'approved', 'rejected'];
    if (!$id || !in_array($status, $allowed, true)) {
        echo json_encode(["status" => "error", "message" => "Valid application id and status are required."]);
        exit;
    }
    try {
        $stmt = $db->prepare("UPDATE cashback_applications SET status = ? WHERE id = ?");
        $stmt->execute([$status, $id]);
        echo json_encode(["status" => "success", "message" => "Cashback application updated."]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

try {
    $where = [];
    $params = [];
    if (!empty($_GET['status'])) { $where[] = "status = ?"; $params[] = $_GET['status']; }
    $sql = "SELECT * FROM cashback_applications";
    if ($where) $sql .= " WHERE " . implode(' AND ', $where);
    $sql .= " ORDER BY id DESC";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $totalAmount = 0;
    foreach ($rows as $r) { $totalAmount += (float)$r['purchase_amount']; }

    echo json_encode([
        "status" => "success",
        "data"   => $rows,
        "summary" => [
            "count"        => count($rows),
            "total_amount" => $totalAmount,
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
