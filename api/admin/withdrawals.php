<?php
// api/admin/withdrawals.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/db.php';

$database = new Database();
$db = $database->getConnection();

try {
    // Migration: Self-Healing Table Schema
    $db->exec("CREATE TABLE IF NOT EXISTS withdrawals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        transaction_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP NULL
    )");
    
    // Ensure bank_details exists
    try { $db->exec("ALTER TABLE withdrawals ADD COLUMN bank_details TEXT AFTER amount"); } catch(Exception $e){}
    // Ensure payment_method exists
    try { $db->exec("ALTER TABLE withdrawals ADD COLUMN payment_method VARCHAR(50) DEFAULT 'Bank Transfer' AFTER bank_details"); } catch(Exception $e){}
    // Ensure transaction_id exists
    try { $db->exec("ALTER TABLE withdrawals ADD COLUMN transaction_id VARCHAR(100) AFTER status"); } catch(Exception $e){}
    try { $db->exec("ALTER TABLE withdrawals ADD COLUMN processed_at TIMESTAMP NULL AFTER created_at"); } catch(Exception $e){}

    $userId = isset($_GET['user_id']) ? $_GET['user_id'] : null;

    $query = "SELECT 
                w.*,
                u.name as user_name,
                u.email as user_email,
                wal.balance as current_balance
              FROM withdrawals w
              JOIN users u ON w.user_id = u.id
              JOIN wallets wal ON u.id = wal.user_id";
    
    if ($userId) {
        $query .= " WHERE w.user_id = :user_id";
    }
    
    $query .= " ORDER BY w.created_at DESC";
              
    $stmt = $db->prepare($query);
    if ($userId) {
        $stmt->bindParam(':user_id', $userId);
    }
    $stmt->execute();
    $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => $requests
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
