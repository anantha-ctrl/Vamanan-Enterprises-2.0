<?php
// api/customer/sign_agreement.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once '../config/db.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->agreement_id) || !isset($data->user_id)) {
    echo json_encode(["status" => "error", "message" => "Missing required identifiers"]);
    exit;
}

try {
    // 1. Verify that the advocate has ratified the agreement first
    $stmt = $db->prepare("SELECT status FROM agreements WHERE id = ? AND user_id = ?");
    $stmt->execute([$data->agreement_id, $data->user_id]);
    $agreement = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$agreement) {
        echo json_encode(["status" => "error", "message" => "Agreement not found"]);
        exit;
    }

    if ($agreement['status'] !== 'ratified') {
        echo json_encode(["status" => "error", "message" => "Legal Ratification required before partner signature."]);
        exit;
    }

    // 2. Perform Digital Signing
    $signStmt = $db->prepare("UPDATE agreements SET status = 'verified', customer_signed_at = CURRENT_TIMESTAMP WHERE id = ?");
    if ($signStmt->execute([$data->agreement_id])) {
        
        // 3. Log Activity
        $logStmt = $db->prepare("INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)");
        $logStmt->execute([$data->user_id, 'partner_signature', "Institutional Deed #{$data->agreement_id} digitally signed by Partner"]);

        echo json_encode([
            "status" => "success", 
            "message" => "Agreement digitally signed and finalized.",
            "signed_at" => date('Y-m-d H:i:s')
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Signing protocol failed"]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
