<?php
// api/admin/tickets.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/db.php';

$database = new Database();
$db = $database->getConnection();

try {
    // Auto-create tickets table if it doesn't exist
    $db->exec("CREATE TABLE IF NOT EXISTS support_tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT,
        priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
        status ENUM('open', 'in-progress', 'resolved', 'closed') DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )");

    $query = "SELECT t.*, u.name as user_name, u.email as user_email 
              FROM support_tickets t 
              JOIN users u ON t.user_id = u.id 
              ORDER BY 
                CASE 
                    WHEN t.priority = 'High' THEN 1 
                    WHEN t.priority = 'Medium' THEN 2 
                    ELSE 3 
                END, 
                t.created_at DESC";
    
    $stmt = $db->query($query);
    $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "data" => $tickets]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
