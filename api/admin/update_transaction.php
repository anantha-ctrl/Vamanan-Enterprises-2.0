<?php
// api/admin/update_transaction.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

require_once '../config/db.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->id) || !isset($data->status)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing ID or Status"]);
    exit;
}

try {
    $stmt = $db->prepare("UPDATE transactions SET status = ? WHERE id = ?");
    $stmt->execute([$data->status, $data->id]);

    echo json_encode([
        "status" => "success",
        "message" => "Transaction status updated to " . $data->status
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
