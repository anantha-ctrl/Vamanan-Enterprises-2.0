<?php
// api/customer/cashback_application.php
// Cashback Application — submit & fetch. Persists to the makkal_gold MySQL database.
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

/* ----------------------------- GET (prefill) ----------------------------- */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $userId = $_GET['user_id'] ?? null;
    if (!$userId) {
        echo json_encode(["status" => "error", "message" => "User ID required"]);
        exit;
    }

    try {
        // Real-time customer data straight from the users table
        $stmt = $db->prepare("SELECT id, customer_id, name, email, phone, address, aadhar_no, pan_no,
                                     referral_code, bank_name, account_no, ifsc_code, branch_name
                              FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $u = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$u) {
            echo json_encode(["status" => "error", "message" => "User not found"]);
            exit;
        }

        // Most recent application by this user (if any)
        $appStmt = $db->prepare("SELECT * FROM cashback_applications WHERE user_id = ? ORDER BY id DESC LIMIT 1");
        $appStmt->execute([$userId]);
        $app = $appStmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            "status" => "success",
            "data" => [
                "user" => $u,
                "application" => $app ?: null
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

    // Basic required-field validation
    $required = ['customer_name', 'phone', 'purchase_amount', 'account_no', 'ifsc_code'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            echo json_encode(["status" => "error", "message" => "Missing required field: " . $field]);
            exit;
        }
    }

    $purchaseDate = !empty($data['purchase_date']) ? $data['purchase_date'] : null;
    $appDate = !empty($data['application_date']) ? $data['application_date'] : date('Y-m-d');

    try {
        $stmt = $db->prepare("INSERT INTO cashback_applications
            (user_id, customer_name, address, phone, aadhar_no, pan_no, customer_code,
             customer_email, referral_id, purchase_amount, purchased_product, product_details,
             purchase_date, bank_account_name, account_no, ifsc_code, bank_name, bank_branch,
             agent_name, agent_id, place, application_date)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");

        $stmt->execute([
            $userId,
            $data['customer_name'] ?? '',
            $data['address'] ?? '',
            $data['phone'] ?? '',
            $data['aadhar_no'] ?? '',
            $data['pan_no'] ?? '',
            $data['customer_code'] ?? '',
            $data['customer_email'] ?? '',
            $data['referral_id'] ?? '',
            (float)($data['purchase_amount'] ?? 0),
            $data['purchased_product'] ?? '',
            $data['product_details'] ?? '',
            $purchaseDate,
            $data['bank_account_name'] ?? '',
            $data['account_no'] ?? '',
            $data['ifsc_code'] ?? '',
            $data['bank_name'] ?? '',
            $data['bank_branch'] ?? '',
            $data['agent_name'] ?? '',
            $data['agent_id'] ?? '',
            $data['place'] ?? 'Krishnagiri',
            $appDate
        ]);

        $newId = $db->lastInsertId();

        echo json_encode([
            "status" => "success",
            "message" => "Cashback application submitted successfully. Awaiting verification.",
            "application_id" => $newId
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

echo json_encode(["status" => "error", "message" => "Method not allowed"]);
?>
