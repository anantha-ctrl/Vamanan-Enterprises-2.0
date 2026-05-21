<?php
// api/customer/update_profile.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../config.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['user_id'])) {
    die(json_encode(["status" => "error", "message" => "Unauthorized access"]));
}

$user_id = $data['user_id'];
$name = $data['name'];
$email = $data['email'];
$phone = $data['phone'];
$address = $data['address'];
$bank_name = $data['bank_name'] ?? '';
$account_no = $data['account_no'] ?? '';
$ifsc_code = $data['ifsc_code'] ?? '';

try {
    // Update basic user info
    $stmt = $pdo->prepare("UPDATE users SET name = ?, email = ?, phone = ?, address = ?, bank_name = ?, account_no = ?, ifsc_code = ? WHERE id = ?");
    $stmt->execute([$name, $email, $phone, $address, $bank_name, $account_no, $ifsc_code, $user_id]);
    
    echo json_encode(["status" => "success", "message" => "Profile updated successfully"]);
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
        echo json_encode(["status" => "error", "message" => "Email or phone already in use"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Update failed: " . $e->getMessage()]);
    }
}
?>
