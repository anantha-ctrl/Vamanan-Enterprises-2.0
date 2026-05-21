<?php
// api/advocate/actions.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once '../config/db.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->action) || !isset($data->id)) {
    echo json_encode(["status" => "error", "message" => "Invalid data"]);
    exit;
}

try {
    switch ($data->action) {
        case 'approve_agreement':
            $stmt = $db->prepare("UPDATE agreements SET status = 'ratified', signed_at = CURRENT_TIMESTAMP WHERE id = ?");
            $stmt->execute([$data->id]);
            
            // Log Activity
            $logStmt = $db->prepare("INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)");
            $logStmt->execute([0, 'legal_approval', "Agreement #{$data->id} ratified by Advocate"]);

            echo json_encode(["status" => "success", "message" => "Agreement Ratified"]);
            break;

        case 'reject_agreement':
            $stmt = $db->prepare("UPDATE agreements SET status = 'rejected' WHERE id = ?");
            $stmt->execute([$data->id]);
            echo json_encode(["status" => "success", "message" => "Agreement Rejected"]);
            break;

        case 'resolve_dispute':
            $stmt = $db->prepare("UPDATE disputes SET status = 'resolved' WHERE id = ?");
            $stmt->execute([$data->id]);
            echo json_encode(["status" => "success", "message" => "Dispute Resolved"]);
            break;
            
        case 'approve_kyc':
            $stmt = $db->prepare("UPDATE users SET kyc_status = 'verified' WHERE id = ?");
            $stmt->execute([$data->id]);
            
            // Log Activity
            $logStmt = $db->prepare("INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)");
            $logStmt->execute([$data->id, 'Identity Ratified', "KYC Protocol verified by Institutional Advocate"]);
            
            echo json_encode(["status" => "success", "message" => "Identity Verified"]);
            break;

        case 'reject_kyc':
            $stmt = $db->prepare("UPDATE users SET kyc_status = 'rejected' WHERE id = ?");
            $stmt->execute([$data->id]);
            
            // Log Activity
            $logStmt = $db->prepare("INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)");
            $logStmt->execute([$data->id, 'Identity Flagged', "KYC Node rejected by Legal Command Center"]);
            
            echo json_encode(["status" => "success", "message" => "Identity Rejected"]);
            break;

        default:
            echo json_encode(["status" => "error", "message" => "Unknown legal action"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
