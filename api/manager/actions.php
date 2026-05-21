<?php
// api/manager/actions.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once '../config/db.php';
require_once '../config/migrate.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->action) || !isset($data->id)) {
    echo json_encode(["status" => "error", "message" => "Invalid data"]);
    exit;
}

// Ensure database is up to date
runMigrations($db);

try {
    switch ($data->action) {
        case 'approve_kyc':
            $db->beginTransaction();
            $stmt = $db->prepare("UPDATE users SET kyc_status = 'verified' WHERE id = ?");
            $stmt->execute([$data->id]);
            
            // Send Notification
            $notifStmt = $db->prepare("INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)");
            $notifStmt->execute([
                $data->id, 
                "Identity Authenticated", 
                "Your institutional KYC profile has been successfully verified. All terminal operations are now active.", 
                "success"
            ]);
            
            $db->commit();
            echo json_encode(["status" => "success", "message" => "KYC Verified & Notification Sent"]);
            break;

        case 'reject_kyc':
            $db->beginTransaction();
            // Clear kyc_document so they must re-upload
            $stmt = $db->prepare("UPDATE users SET kyc_status = 'rejected', kyc_document = NULL WHERE id = ?");
            $stmt->execute([$data->id]);
            
            // Send Notification
            $notifStmt = $db->prepare("INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)");
            $notifStmt->execute([
                $data->id, 
                "Validation Failed", 
                "Your identity audit encountered compliance issues. Please review your details and re-submit high-resolution documentation.", 
                "error"
            ]);
            
            $db->commit();
            echo json_encode(["status" => "success", "message" => "KYC Rejected & Notification Sent"]);
            break;

        case 'approve_withdrawal':
            $db->beginTransaction();
            $stmt = $db->prepare("SELECT * FROM withdrawals WHERE id = ? AND status = 'pending'");
            $stmt->execute([$data->id]);
            $withdrawal = $stmt->fetch();

            if ($withdrawal) {
                $updateStmt = $db->prepare("UPDATE withdrawals SET status = 'approved' WHERE id = ?");
                $updateStmt->execute([$data->id]);
                $db->commit();
                echo json_encode(["status" => "success", "message" => "Withdrawal Approved"]);
            } else {
                $db->rollBack();
                echo json_encode(["status" => "error", "message" => "Withdrawal not found or already processed"]);
            }
            break;

        case 'reject_withdrawal':
            $stmt = $db->prepare("UPDATE withdrawals SET status = 'rejected' WHERE id = ?");
            $stmt->execute([$data->id]);
            echo json_encode(["status" => "success", "message" => "Withdrawal Rejected"]);
            break;

        case 'activate_user':
            $stmt = $db->prepare("UPDATE users SET status = 'active' WHERE id = ?");
            $stmt->execute([$data->id]);
            echo json_encode(["status" => "success", "message" => "User Access Granted"]);
            break;

        case 'suspend_user':
            $stmt = $db->prepare("UPDATE users SET status = 'suspended' WHERE id = ?");
            $stmt->execute([$data->id]);
            echo json_encode(["status" => "success", "message" => "User Suspended"]);
            break;

        default:
            echo json_encode(["status" => "error", "message" => "Unknown action"]);
    }
} catch (Exception $e) {
    if ($db && $db->inTransaction()) $db->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
