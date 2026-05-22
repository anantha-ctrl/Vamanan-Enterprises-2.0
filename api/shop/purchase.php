<?php
// api/shop/purchase.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once '../config.php';
require_once '../models/Wallet.php';
$db = $pdo;
$walletModel = new Wallet($db);

// Handle both JSON and FormData
$data = (object)[];
if ($_SERVER['CONTENT_TYPE'] && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
    $data = json_decode(file_get_contents("php://input"));
} else {
    $data = (object)$_POST;
}

if (!isset($data->user_id) || !isset($data->weight)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing user_id or weight."]);
    exit;
}

try {
    // Self-healing schema repair (ensure columns exist before processing)
    try { $db->exec("ALTER TABLE cashback_cycles ADD COLUMN transaction_id VARCHAR(255)"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE cashback_cycles ADD COLUMN payment_method VARCHAR(50) DEFAULT 'Bank Transfer'"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE cashback_cycles ADD COLUMN payment_screenshot VARCHAR(255)"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE cashback_cycles ADD COLUMN asset_type VARCHAR(20) DEFAULT 'gold'"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE cashback_cycles ADD COLUMN weight DECIMAL(10,3) DEFAULT 0"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE cashback_cycles ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE transactions MODIFY COLUMN category ENUM('payout', 'referral', 'manual', 'deposit', 'purchase_request', 'other') DEFAULT 'other'"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE agreements ADD COLUMN agreement_id VARCHAR(50) UNIQUE AFTER user_id"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE agreements ADD COLUMN product_id INT AFTER user_id"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE agreements ADD COLUMN agreement_date DATETIME DEFAULT CURRENT_TIMESTAMP AFTER product_id"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE agreements ADD COLUMN type VARCHAR(100) DEFAULT 'Investment Deed'"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE agreements ADD COLUMN status ENUM('pending', 'verified', 'rejected', 'legal_review') DEFAULT 'pending'"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE agreements ADD COLUMN content LONGTEXT"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE agreements ADD COLUMN signed_at TIMESTAMP NULL"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE agreements ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"); } catch (Exception $e) {}

    $db->beginTransaction();

    // Handle File Upload
    $screenshot_path = null;
    if (isset($_FILES['screenshot'])) {
        $target_dir = "../../uploads/payments/";
        if (!file_exists($target_dir)) mkdir($target_dir, 0777, true);
        
        $file_ext = pathinfo($_FILES["screenshot"]["name"], PATHINFO_EXTENSION);
        $file_name = "pay_" . time() . "_" . $data->user_id . "." . $file_ext;
        $target_file = $target_dir . $file_name;
        
        if (move_uploaded_file($_FILES["screenshot"]["tmp_name"], $target_file)) {
            $screenshot_path = "uploads/payments/" . $file_name;
        }
    }

    // Fetch platform settings for pricing
    $sStmt = $db->query("SELECT config_key, config_value FROM platform_settings");
    $settings = $sStmt->fetchAll(PDO::FETCH_KEY_PAIR);
    $gold_base_price = isset($settings['gold_base_price']) ? (float)$settings['gold_base_price'] : 7250;
    $silver_base_price = isset($settings['silver_base_price']) ? (float)$settings['silver_base_price'] : 100;
    $gst_percentage = isset($settings['gst_percentage']) ? (float)$settings['gst_percentage'] : 3;

    $asset_type = isset($data->asset_type) ? strtolower($data->asset_type) : 'gold';
    $payment_method = (isset($data->payment_mode) && strtolower($data->payment_mode) === 'upi') ? 'UPI Scan' : 'Bank Transfer';
    $weight = (float)$data->weight;
    
    $base_price = ($asset_type === 'silver') ? $silver_base_price : $gold_base_price;
    $base_amount = $base_price * $weight;
    $gst_amount = $base_amount * ($gst_percentage / 100);
    $total_price = $base_amount + $gst_amount;

    $min_investment = isset($settings['min_investment']) ? (float)$settings['min_investment'] : 1000;
    
    if ($total_price < $min_investment) {
        throw new Exception("Minimum investment required is ₹" . number_format($min_investment) . ". Please increase the weight.");
    }
    
    $asset_label = ($asset_type === 'silver') ? 'Silver' : '24K Gold';
    $product_name = $weight . " Gram(s) " . $asset_label;

    // Update User Phone if provided and currently missing
    if (!empty($data->phone)) {
        $uCheck = $db->prepare("SELECT phone FROM users WHERE id = ?");
        $uCheck->execute([$data->user_id]);
        $uRow = $uCheck->fetch();
        if ($uRow && empty($uRow['phone'])) {
            $uUpdate = $db->prepare("UPDATE users SET phone = ? WHERE id = ?");
            $uUpdate->execute([$data->phone, $data->user_id]);
        }
    }

    // 2. Get/Create Wallet
    $balanceData = $walletModel->getBalance($data->user_id);
    $walletId = $balanceData['id'];

    // 3. Check for existing PENDING request (prevent duplicate submissions)
    $existCheck = $db->prepare("SELECT id FROM cashback_cycles WHERE user_id = :uid AND status = 'pending'");
    $existCheck->execute(['uid' => $data->user_id]);
    if ($existCheck->fetch()) {
        throw new Exception("You already have a pending investment request. Please wait for admin approval.");
    }

    // 4. Log Transaction (Pending - no balance deduction)
    $tStmt = $db->prepare(
        "INSERT INTO transactions (wallet_id, type, category, amount, description, status) 
         VALUES (:wallet_id, 'debit', 'purchase_request', :amount, :desc, 'pending')"
    );
    $tStmt->execute([
        'wallet_id' => $walletId,
        'amount'    => $total_price,
        'desc'      => "Investment Request: " . $product_name . " (Awaiting Admin Approval)"
    ]);

    // 5. Create Cashback Cycle (Pending)
    $daily = round($total_price * 0.01, 2);
    $cStmt = $db->prepare(
        "INSERT INTO cashback_cycles (user_id, total_value, daily_payout, transaction_id, payment_method, payment_screenshot, asset_type, weight, status) 
         VALUES (:user_id, :total, :daily, :tid, :payment_method, :shot, :asset, :weight, 'pending')"
    );
    $cStmt->execute([
        'user_id' => $data->user_id,
        'total'   => $total_price,
        'daily'   => $daily,
        'tid'     => isset($data->transaction_id) ? $data->transaction_id : null,
        'payment_method' => $payment_method,
        'shot'    => $screenshot_path,
        'asset'   => $asset_type,
        'weight'  => $weight
    ]);
    $cycleId = $db->lastInsertId();

    // 6. Create Agreement (Pending)
    $pStmt = $db->query("SELECT id FROM products LIMIT 1");
    $firstProduct = $pStmt->fetch(PDO::FETCH_ASSOC);
    
    $valid_product_id = null;
    if ($firstProduct) {
        $valid_product_id = $firstProduct['id'];
    } else {
        $db->exec("INSERT INTO products (name, slug, price) VALUES ('Custom Gold Asset', 'custom-gold-asset', 7250)");
        $valid_product_id = $db->lastInsertId();
    }

    $agrId = "AGR-" . time() . "-" . $data->user_id;
    $agrType = ($asset_type === 'silver') ? 'Silver Acquisition Deed' : 'Gold Acquisition Deed';

    $aStmt = $db->prepare(
        "INSERT INTO agreements (user_id, product_id, agreement_id, type, status) 
         VALUES (:user_id, :product_id, :agr_id, :type, 'pending')"
    );
    $aStmt->execute([
        'user_id'    => $data->user_id,
        'product_id' => $valid_product_id,
        'agr_id'     => $agrId,
        'type'       => $agrType
    ]);

    $db->commit();

    echo json_encode([
        "status"  => "success",
        "message" => "Investment request submitted! Your payment for '{$product_name}' is now pending admin approval.",
        "product" => $product_name,
        "cycle_id" => $cycleId
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
