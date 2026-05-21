<?php
// api/auth/seed.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: text/plain");

require_once '../config.php';

try {
    // Helper function to create/update user
    if (!function_exists('upsertUser')) {
        function upsertUser($pdo, $email, $name, $role, $referral_code) {
            $password = 'password';
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch();

            if (!$user) {
                $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, referral_code) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$name, $email, $password, $role, $referral_code]);
                $userId = $pdo->lastInsertId();
                
                // Initialize Wallet
                $stmt = $pdo->prepare("INSERT INTO wallets (user_id, balance) VALUES (?, 1000.00)");
                $stmt->execute([$userId]);
                
                echo "SUCCESS: Created $role ($email)\n";
            } else {
                $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE email = ?");
                $stmt->execute([$password, $email]);
                echo "INFO: Updated password for $role ($email) to 'password'\n";
            }
        }
    }

    upsertUser($pdo, 'admin@makkalgold.com', 'System Admin', 'admin', 'ADMIN777');
    upsertUser($pdo, 'manager@makkalgold.com', 'Gold Manager', 'manager', 'MGR888');
    upsertUser($pdo, 'staff@makkalgold.com', 'Store Staff', 'staff', 'STF999');

    echo "\nAll default accounts are now ready with password: password\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
