<?php
// api/admin/export_payouts.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET");

date_default_timezone_set('Asia/Kolkata');
require_once '../config/db.php';

$database = new Database();
$db = $database->getConnection();

try {
    if (!$db) throw new Exception("Database connection failed");
    $db->exec("SET time_zone = '+05:30'");

    // Migration check: Ensure export_history table exists
    $db->exec("CREATE TABLE IF NOT EXISTS export_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255),
        export_type VARCHAR(50),
        total_amount DECIMAL(15,2),
        total_records INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Migration failed: " . $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    try {
        // Fetch Export History
        $stmt = $db->query("SELECT * FROM export_history ORDER BY created_at DESC LIMIT 50");
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "status" => "success",
            "data" => $history
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} elseif ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data || !isset($data['filename'])) {
        echo json_encode(["status" => "error", "message" => "Invalid data"]);
        exit;
    }

    try {
        $db->beginTransaction();

        $stmt = $db->prepare("INSERT INTO export_history (filename, export_type, total_amount, total_records) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            $data['filename'],
            $data['export_type'] ?? 'Bank Bulk Transfer',
            $data['total_amount'] ?? 0,
            $data['total_records'] ?? 0
        ]);

        // Update transaction statuses if IDs are provided
        if (isset($data['transaction_ids']) && is_array($data['transaction_ids']) && count($data['transaction_ids']) > 0) {
            $ids = implode(',', array_map('intval', $data['transaction_ids']));
            $db->exec("UPDATE transactions SET status = 'completed' WHERE id IN ($ids)");
        }

        $db->commit();
        echo json_encode(["status" => "success", "message" => "Export recorded and transactions updated successfully"]);
    } catch (Exception $e) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>