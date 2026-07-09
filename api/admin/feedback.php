<?php
// api/admin/feedback.php
//   GET                       -> list all customer feedback (customer_to_admin) + admin replies
//   POST {action:'reply', ...}-> admin/manager sends feedback/remark to a customer
//   POST {action:'read', id}  -> mark a customer feedback as read
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once '../config.php';

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Inbox: feedback customers sent to the company
        $inbox = $pdo->query("SELECT f.*, u.name AS from_name, u.email AS from_email, u.customer_id
                              FROM feedbacks f
                              LEFT JOIN users u ON f.from_user_id = u.id
                              WHERE f.direction = 'customer_to_admin'
                              ORDER BY f.created_at DESC")->fetchAll(PDO::FETCH_ASSOC);

        // Sent: feedback admin/manager sent to customers
        $sent = $pdo->query("SELECT f.*, c.name AS to_name, c.customer_id, s.name AS sender_name, s.role AS sender_role
                             FROM feedbacks f
                             LEFT JOIN users c ON f.to_user_id = c.id
                             LEFT JOIN users s ON f.from_user_id = s.id
                             WHERE f.direction = 'admin_to_customer'
                             ORDER BY f.created_at DESC")->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "status" => "success",
            "data" => [
                "inbox" => $inbox,
                "sent" => $sent,
                "unread_count" => (int)$pdo->query("SELECT COUNT(*) FROM feedbacks WHERE direction='customer_to_admin' AND is_read=0")->fetchColumn()
            ]
        ]);
        exit;
    }

    // POST
    $data   = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? 'reply';

    if ($action === 'read') {
        $id = (int)($data['id'] ?? 0);
        $pdo->prepare("UPDATE feedbacks SET is_read = 1 WHERE id = ?")->execute([$id]);
        echo json_encode(["status" => "success", "message" => "Marked as read"]);
        exit;
    }

    if ($action === 'delete') {
        $id = (int)($data['id'] ?? 0);
        $pdo->prepare("DELETE FROM feedbacks WHERE id = ?")->execute([$id]);
        echo json_encode(["status" => "success", "message" => "Deleted"]);
        exit;
    }

    // reply -> admin/manager to customer
    $from_user_id = (int)($data['from_user_id'] ?? 0);   // the admin/manager
    $to_user_id   = (int)($data['to_user_id'] ?? 0);     // the customer
    $subject      = trim($data['subject'] ?? '');
    $message      = trim($data['message'] ?? '');

    if (!$from_user_id || !$to_user_id || $message === '') {
        echo json_encode(["status" => "error", "message" => "from_user_id, to_user_id and message are required"]);
        exit;
    }

    $roleStmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $roleStmt->execute([$from_user_id]);
    $fromRole = $roleStmt->fetchColumn() ?: 'admin';

    $stmt = $pdo->prepare("INSERT INTO feedbacks (from_user_id, to_user_id, from_role, direction, subject, message)
                           VALUES (?, ?, ?, 'admin_to_customer', ?, ?)");
    $stmt->execute([$from_user_id, $to_user_id, $fromRole, $subject, $message]);

    // Also drop a notification so the customer is alerted
    try {
        $pdo->prepare("INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'info')")
            ->execute([$to_user_id, $subject !== '' ? $subject : 'New feedback from the team', $message]);
    } catch (Exception $e) {}

    echo json_encode(["status" => "success", "message" => "Feedback sent to customer", "id" => $pdo->lastInsertId()]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
