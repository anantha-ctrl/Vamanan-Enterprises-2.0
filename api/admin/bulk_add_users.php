<?php
// api/admin/bulk_add_users.php
// Bulk-create customers in one shot. Accepts either:
//   - a JSON body { users: [ { name, email, phone, password?, role?, referral_code? }, ... ] }
//   - a CSV file upload (field "file") with header columns: name,email,phone,password,role,referral_code
// Each new user gets a sequential VEV### customer id, a referral code and an initialised wallet.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

require_once '../config.php';
$db = $pdo;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit;
}

// ---- Gather rows from JSON body or CSV upload ----
$rows = [];
if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
    $handle = fopen($_FILES['file']['tmp_name'], 'r');
    if (!$handle) { echo json_encode(["status" => "error", "message" => "Could not read the uploaded file."]); exit; }
    $header = fgetcsv($handle);
    if (!$header) { fclose($handle); echo json_encode(["status" => "error", "message" => "The file appears to be empty."]); exit; }
    $header[0] = preg_replace('/^\xEF\xBB\xBF/', '', $header[0]); // strip BOM
    $cols = [];
    foreach ($header as $i => $h) $cols[strtolower(trim($h))] = $i;
    while (($r = fgetcsv($handle)) !== false) {
        if (count(array_filter($r, fn($v) => trim((string)$v) !== '')) === 0) continue; // blank line
        $pick = fn($k) => isset($cols[$k]) && isset($r[$cols[$k]]) ? trim($r[$cols[$k]]) : '';
        $rows[] = [
            'name'          => $pick('name'),
            'email'         => $pick('email'),
            'phone'         => $pick('phone'),
            'password'      => $pick('password'),
            'role'          => $pick('role'),
            'referral_code' => $pick('referral_code'),
        ];
    }
    fclose($handle);
} else {
    $body = json_decode(file_get_contents("php://input"), true) ?: [];
    $rows = $body['users'] ?? [];
}

if (!is_array($rows) || count($rows) === 0) {
    echo json_encode(["status" => "error", "message" => "No users provided."]);
    exit;
}

$validRoles = ['admin', 'manager', 'staff', 'advocate', 'customer'];

try {
    // Sequential VEV### customer id (computed once, incremented per insert)
    $seq = (int)$db->query("SELECT COALESCE(MAX(CAST(SUBSTRING(customer_id, 4) AS UNSIGNED)), 0) FROM users WHERE customer_id LIKE 'VEV%'")->fetchColumn();

    $checkEmail = $db->prepare("SELECT id FROM users WHERE email = ?");
    $findRef    = $db->prepare("SELECT id FROM users WHERE referral_code = ?");
    $insertUser = $db->prepare("INSERT INTO users (name, email, password, phone, role, customer_id, referral_code, referrer_id, status, created_at)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())");
    $insertWallet = $db->prepare("INSERT INTO wallets (user_id, balance) VALUES (?, 0.00)");

    $inserted = 0;
    $errors = [];
    $created = [];
    $rowNum = 0;

    foreach ($rows as $u) {
        $rowNum++;
        $name  = trim((string)($u['name'] ?? ''));
        $email = trim((string)($u['email'] ?? ''));
        $phone = trim((string)($u['phone'] ?? ''));
        $role  = strtolower(trim((string)($u['role'] ?? 'customer'))) ?: 'customer';
        if (!in_array($role, $validRoles, true)) $role = 'customer';
        // Default password to the phone number if none supplied (stored as-is, matching register.php).
        $password = trim((string)($u['password'] ?? '')) ?: ($phone ?: 'vamanan123');
        $refCode  = trim((string)($u['referral_code'] ?? ''));

        if ($name === '' || $email === '' || $phone === '') {
            $errors[] = "Row $rowNum: name, email and phone are required — skipped.";
            continue;
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors[] = "Row $rowNum ($email): invalid email — skipped.";
            continue;
        }

        $checkEmail->execute([$email]);
        if ($checkEmail->fetch()) {
            $errors[] = "Row $rowNum ($email): email already registered — skipped.";
            continue;
        }

        // Resolve referrer (optional)
        $referrerId = null;
        if ($refCode !== '') {
            $findRef->execute([$refCode]);
            if ($ref = $findRef->fetch()) $referrerId = $ref['id'];
        }

        $customerId   = 'VEV' . str_pad(++$seq, 3, '0', STR_PAD_LEFT);
        $referralCode = vevGenerateReferralCode($db);

        try {
            $db->beginTransaction();
            $insertUser->execute([$name, $email, $password, $phone, $role, $customerId, $referralCode, $referrerId]);
            $uid = $db->lastInsertId();
            $insertWallet->execute([$uid]);
            $db->commit();
            $inserted++;
            $created[] = ['id' => (int)$uid, 'customer_id' => $customerId, 'name' => $name, 'email' => $email];
        } catch (PDOException $e) {
            if ($db->inTransaction()) $db->rollBack();
            $seq--; // free the id since this insert failed
            $errors[] = "Row $rowNum ($email): " . $e->getMessage();
        }
    }

    echo json_encode([
        "status"   => "success",
        "message"  => "$inserted user(s) added successfully" . (count($errors) ? " · " . count($errors) . " skipped" : "") . ".",
        "inserted" => $inserted,
        "created"  => $created,
        "errors"   => $errors,
    ]);
} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
