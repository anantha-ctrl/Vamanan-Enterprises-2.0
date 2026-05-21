<?php
// api/customer/kyc.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config.php';
$db = $pdo;

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $userId = $_GET['user_id'] ?? null;
    if (!$userId) {
        echo json_encode(["status" => "error", "message" => "User ID required"]);
        exit;
    }

    try {
        $stmt = $db->prepare("SELECT phone, address, aadhar_no, pan_no, kyc_status, kyc_document, bank_name, account_no, ifsc_code, branch_name FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($data) {
            echo json_encode(["status" => "success", "data" => $data]);
        } else {
            echo json_encode(["status" => "error", "message" => "User not found"]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $userId = $_POST['user_id'] ?? null;
    $address = $_POST['address'] ?? '';
    $phone = $_POST['phone'] ?? '';
    $aadhar = $_POST['aadhar_no'] ?? '';
    $pan = $_POST['pan_no'] ?? '';
    $bank_name = $_POST['bank_name'] ?? '';
    $account_no = $_POST['account_no'] ?? '';
    $ifsc_code = $_POST['ifsc_code'] ?? '';
    $branch_name = $_POST['branch_name'] ?? '';

    if (!$userId) {
        echo json_encode(["status" => "error", "message" => "User ID required"]);
        exit;
    }

    try {
        $kycPath = '';
        if (isset($_FILES['document'])) {
            if ($_FILES['document']['error'] === UPLOAD_ERR_OK) {
                $uploadDir = '../../uploads/kyc/';
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }
                
                $fileExt = pathinfo($_FILES['document']['name'], PATHINFO_EXTENSION);
                $fileName = "kyc_" . $userId . "_" . time() . "." . $fileExt;
                $targetPath = $uploadDir . $fileName;
                
                if (move_uploaded_file($_FILES['document']['tmp_name'], $targetPath)) {
                    $kycPath = 'uploads/kyc/' . $fileName;
                } else {
                    throw new Exception("Failed to move uploaded file to target directory.");
                }
            } else {
                throw new Exception("File upload error code: " . $_FILES['document']['error']);
            }
        }

        // Update user record
        $query = "UPDATE users SET 
                    address = :address, 
                    phone = :phone, 
                    aadhar_no = :aadhar, 
                    pan_no = :pan, 
                    bank_name = :bank_name,
                    account_no = :account_no,
                    ifsc_code = :ifsc_code,
                    branch_name = :branch_name,
                    kyc_status = 'pending'";
        
        if ($kycPath) {
            $query .= ", kyc_document = :doc";
        }
        
        $query .= " WHERE id = :user_id";
        
        $stmt = $db->prepare($query);
        $params = [
            'address' => $address,
            'phone' => $phone,
            'aadhar' => $aadhar,
            'pan' => $pan,
            'bank_name' => $bank_name,
            'account_no' => $account_no,
            'ifsc_code' => $ifsc_code,
            'branch_name' => $branch_name,
            'user_id' => $userId
        ];
        
        if ($kycPath) {
            $params['doc'] = $kycPath;
        }

        if ($stmt->execute($params)) {
            // Fetch updated data
            $stmt = $db->prepare("SELECT phone, address, aadhar_no, pan_no, kyc_status, bank_name, account_no, ifsc_code, branch_name FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $data = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode(["status" => "success", "message" => "KYC details submitted for verification.", "data" => $data]);
        } else {
            $errorInfo = $stmt->errorInfo();
            throw new Exception("Database update failed: " . $errorInfo[2]);
        }

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>
