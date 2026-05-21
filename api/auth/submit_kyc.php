<?php
// api/auth/submit_kyc.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once '../config/db.php';

$database = new Database();
$db = $database->getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user_id = $_POST['user_id'] ?? null;
    
    if (!$user_id) {
        echo json_encode(["status" => "error", "message" => "User ID required"]);
        exit;
    }

    if (isset($_FILES['document'])) {
        $target_dir = "../../uploads/kyc/";
        if (!file_exists($target_dir)) {
            mkdir($target_dir, 0777, true);
        }

        $file_extension = pathinfo($_FILES["document"]["name"], PATHINFO_EXTENSION);
        $file_name = "kyc_" . $user_id . "_" . time() . "." . $file_extension;
        $target_file = $target_dir . $file_name;

        if (move_uploaded_file($_FILES["document"]["tmp_name"], $target_file)) {
            // Update database
            $query = "UPDATE users SET kyc_status = 'pending', kyc_document = :doc WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->execute([
                'doc' => 'uploads/kyc/' . $file_name,
                'id' => $user_id
            ]);

            echo json_encode(["status" => "success", "message" => "KYC document submitted successfully. Waiting for approval."]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to upload document."]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "No document uploaded."]);
    }
}
?>
