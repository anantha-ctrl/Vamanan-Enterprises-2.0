<?php
// api/admin/add_staff.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once '../config.php';
require_once '../config/migrate.php';
$db = $pdo;

// Synchronize database schema
runMigrations($db);

$data = json_decode(file_get_contents("php://input"));

$allowedRoles = ['manager', 'staff', 'advocate'];
$allowedPermissions = [
    'overview',
    'investments',
    'investment_history',
    'inventory',
    'users',
    'genealogy',
    'wallets_view',
    'wallet_adj',
    'kyc',
    'withdrawals',
    'tickets',
    'market_rates',
    'recruitment',
    'settings',
    'fiscal_reports',
    'cashback_reports',
    'withdrawal_reports',
    'transaction_reports',
    'investment_reports',
    'referral_reports',
    'payout_reports',
    'payout_reports_module',
    'cashback_payouts',
    'export_payouts',
    'payout_reconciliation',
    'wallets_list',
    'broadcast',
    'agreements'
];

function normalizePermissions($permissions, $allowedPermissions) {
    if (is_string($permissions)) {
        $decoded = json_decode($permissions, true);
        $permissions = is_array($decoded) ? $decoded : array_filter(array_map('trim', explode(',', $permissions)));
    }

    if (!is_array($permissions)) {
        return [];
    }

    return array_values(array_intersect(array_unique($permissions), $allowedPermissions));
}

if(!empty($data->name) && !empty($data->email) && !empty($data->password) && !empty($data->role)) {
    $role = strtolower(trim($data->role));
    if (!in_array($role, $allowedRoles, true)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid staff role."]);
        exit;
    }

    $permissions = normalizePermissions($data->permissions ?? [], $allowedPermissions);

    // 1. Check if user exists
    $checkQuery = "SELECT id FROM users WHERE email = :email";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->execute(['email' => $data->email]);
    
    if($checkStmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Email already registered."]);
        exit;
    }

    $referralCode = strtoupper(substr(md5(uniqid()), 0, 8));

    try {
        $db->beginTransaction();

        // 2. Create Staff User
        $query = "INSERT INTO users (name, email, password, role, referral_code, status, permissions) 
                  VALUES (:name, :email, :password, :role, :referral_code, 'active', :permissions)";
        
        $stmt = $db->prepare($query);
        $stmt->execute([
            'name' => $data->name,
            'email' => $data->email,
            'password' => $data->password, // Stored as plain text per project pattern
            'role' => $role,
            'referral_code' => $referralCode,
            'permissions' => json_encode($permissions)
        ]);

        $userId = $db->lastInsertId();

        // 3. Initialize Wallet
        $walletQuery = "INSERT INTO wallets (user_id, balance) VALUES (:user_id, 0.00)";
        $walletStmt = $db->prepare($walletQuery);
        $walletStmt->execute(['user_id' => $userId]);

        $db->commit();

        echo json_encode([
            "status" => "success",
            "message" => "Staff account created successfully.",
            "user_id" => $userId
        ]);

    } catch (Exception $e) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Server error: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Please fill all required fields."]);
}
?>
