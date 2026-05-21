<?php
// scratch/create_advocate.php
require_once '../api/config.php';
require_once '../api/config/migrate.php';

$db = $pdo;

// Ensure migrations are run to support advocate role
runMigrations($db);

$name = "Vamanan Advocate";
$email = "advocate@makkalgold.com";
$password = "password123";
$role = "advocate";
$status = "active";
$referralCode = "ADV001";

try {
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo "Advocate account already exists: $email\n";
    } else {
        $stmt = $db->prepare("INSERT INTO users (name, email, password, role, status, referral_code) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$name, $email, $password, $role, $status, $referralCode]);
        $userId = $db->lastInsertId();
        
        // Initialize Wallet
        $stmt = $db->prepare("INSERT INTO wallets (user_id, balance) VALUES (?, 0.00)");
        $stmt->execute([$userId]);
        
        echo "Advocate account created successfully!\n";
        echo "Email: $email\n";
        echo "Password: $password\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
