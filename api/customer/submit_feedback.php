<?php
// api/customer/submit_feedback.php — customer submits feedback / remarks to the company
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once '../config.php';

$data = json_decode(file_get_contents("php://input"), true);
$user_id = isset($data['user_id']) ? (int)$data['user_id'] : 0;
$subject = isset($data['subject']) ? trim($data['subject']) : '';
$message = isset($data['message']) ? trim($data['message']) : '';
$rating  = isset($data['rating']) && $data['rating'] !== '' ? (int)$data['rating'] : null;

if (!$user_id || $message === '') {
    echo json_encode(["status" => "error", "message" => "user_id and message are required"]);
    exit;
}

try {
    // Confirm sender role for the record
    $roleStmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $roleStmt->execute([$user_id]);
    $fromRole = $roleStmt->fetchColumn() ?: 'customer';

    $stmt = $pdo->prepare("INSERT INTO feedbacks (from_user_id, to_user_id, from_role, direction, subject, message, rating)
                           VALUES (?, NULL, ?, 'customer_to_admin', ?, ?, ?)");
    $stmt->execute([$user_id, $fromRole, $subject, $message, $rating]);

    echo json_encode(["status" => "success", "message" => "Thank you! Your feedback has been submitted.", "id" => $pdo->lastInsertId()]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
