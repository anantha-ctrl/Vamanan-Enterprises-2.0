<?php
// api/admin/broadcast.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once '../config/db.php';
require_once '../config/migrate.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    die(json_encode(["status" => "error", "message" => "Database connection failed"]));
}

// Ensure database is up to date
runMigrations($db);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (!empty($data->title) && !empty($data->message)) {
        try {
            $query = "INSERT INTO notifications (title, message, type) VALUES (:title, :message, :type)";
            $stmt = $db->prepare($query);
            $stmt->execute([
                'title' => $data->title,
                'message' => $data->message,
                'type' => $data->type ?? 'info'
            ]);

            echo json_encode(["status" => "success", "message" => "Broadcast sent successfully."]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Title and Message are required."]);
    }
} elseif ($method === 'GET') {
    try {
        $query = "SELECT * FROM notifications WHERE is_active = 1 ORDER BY created_at DESC LIMIT 10";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(["status" => "success", "data" => $notifications]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>