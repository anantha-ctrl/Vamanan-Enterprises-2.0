<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../config.php';

if (!isset($_POST['user_id']) || !isset($_FILES['avatar'])) {
    echo json_encode(["status" => "error", "message" => "Missing data"]);
    exit;
}

$user_id = $_POST['user_id'];
$file = $_FILES['avatar'];

// Create upload directory if it doesn't exist
$upload_dir = "../../uploads/avatars/";
if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

$file_ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$file_name = "avatar_" . $user_id . "_" . time() . "." . $file_ext;
$target_file = $upload_dir . $file_name;

if (move_uploaded_file($file['tmp_name'], $target_file)) {
    try {
        // Save relative path to DB
        $db_path = "uploads/avatars/" . $file_name;
        $query = "UPDATE users SET avatar = :avatar WHERE id = :id";
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(":avatar", $db_path);
        $stmt->bindParam(":id", $user_id);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Photo uploaded", "path" => $db_path]);
        } else {
            echo json_encode(["status" => "error", "message" => "Database update failed"]);
        }
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "File upload failed"]);
}
?>
