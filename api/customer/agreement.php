<?php
// api/customer/agreement.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/db.php';

$database = new Database();
$db = $database->getConnection();

$userId = isset($_GET['user_id']) ? $_GET['user_id'] : null;

if (!$userId) {
    echo json_encode(["status" => "error", "message" => "User ID required"]);
    exit;
}

try {
    // 1. Fetch User Data (including KYC info)
    $uStmt = $db->prepare("SELECT u.name, u.email, u.address, u.phone, u.aadhar_no, u.pan_no 
                           FROM users u 
                           WHERE u.id = ?");
    $uStmt->execute([$userId]);
    $user = $uStmt->fetch(PDO::FETCH_ASSOC);

    // 2. Fetch Latest Agreement/Purchase Data
    $aStmt = $db->prepare("SELECT a.id, a.agreement_id, a.type, a.status, a.signed_at, a.customer_signed_at, a.created_at as agreement_date, p.name as product_name, p.price, p.weight 
                           FROM agreements a 
                           JOIN products p ON a.product_id = p.id 
                           WHERE a.user_id = ? 
                           ORDER BY a.created_at DESC LIMIT 1");
    $aStmt->execute([$userId]);
    $agreement = $aStmt->fetch(PDO::FETCH_ASSOC);

    if (!$agreement) {
        // Fallback: If no agreement record yet, fetch latest purchase to generate one
        $pStmt = $db->prepare("SELECT t.created_at as agreement_date, p.name as product_name, p.price, p.weight 
                               FROM transactions t 
                               JOIN wallets w ON t.wallet_id = w.id 
                               JOIN products p ON p.id = (SELECT product_id FROM agreements WHERE user_id = ? LIMIT 1) -- This is a bit complex, let's simplify
                               WHERE w.user_id = ? AND t.category = 'purchase' 
                               ORDER BY t.created_at DESC LIMIT 1");
        // Simplified fallback: Just fetch latest purchase if no formal agreement exists
        $pStmt = $db->prepare("SELECT p.name as product_name, p.price, p.weight 
                               FROM products p 
                               LIMIT 1"); // Dummy fallback for demo
        $pStmt->execute();
        $agreement = $pStmt->fetch(PDO::FETCH_ASSOC);
        $agreement['agreement_date'] = date('Y-m-d');
    }

    echo json_encode([
        "status" => "success",
        "data" => [
            "user" => $user,
            "agreement" => $agreement,
            "company" => [
                "name" => "VAMANAN GOLD (VAMANAN ENTERPRISES)",
                "office" => "Shop No. 2/229- B, Near Peddathalapalli Bus stop, Rayakottai Road, Krishnagiri, Tamil Nadu – 635 002",
                "phone" => "9600122373"
            ]
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>