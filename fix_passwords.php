<?php
require_once 'api/config.php';

try {
    $stmt = $pdo->query("SELECT id, password FROM users");
    $users = $stmt->fetchAll();
    $fixed = 0;

    foreach ($users as $user) {
        $id = $user['id'];
        $pwd = $user['password'];

        // Check if it's already a Bcrypt hash
        if (substr($pwd, 0, 4) !== '$2y$') {
            $hashed = password_hash($pwd, PASSWORD_BCRYPT);
            $update = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
            $update->execute([$hashed, $id]);
            $fixed++;
        }
    }

    echo json_encode(["status" => "success", "message" => "Fixed $fixed passwords."]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
