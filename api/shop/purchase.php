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
    try { $db->exec("ALTER TABLE cashback_cycles ADD COLUMN ledger_txn_id INT NULL"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE transactions MODIFY COLUMN category ENUM('purchase', 'purchase_request', 'referral', 'cashback', 'payout', 'withdrawal', 'liquidation', 'manual', 'deposit', 'other') DEFAULT 'other'"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE agreements ADD COLUMN agreement_id VARCHAR(50) UNIQUE AFTER user_id"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE agreements ADD COLUMN product_id INT AFTER user_id"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE agreements ADD COLUMN agreement_date DATETIME DEFAULT CURRENT_TIMESTAMP AFTER product_id"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE agreements ADD COLUMN type VARCHAR(100) DEFAULT 'Investment Deed'"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE agreements ADD COLUMN status ENUM('pending', 'verified', 'rejected', 'legal_review') DEFAULT 'pending'"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE agreements ADD COLUMN content LONGTEXT"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE agreements ADD COLUMN signed_at TIMESTAMP NULL"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE agreements ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"); } catch (Exception $e) {}

    // Cashback applications table — created here (DDL) BEFORE the transaction, because DDL
    // implicitly commits in MySQL and would otherwise break the purchase transaction.
    try {
        $db->exec("CREATE TABLE IF NOT EXISTS cashback_applications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            customer_name VARCHAR(255), address TEXT, phone VARCHAR(20),
            aadhar_no VARCHAR(20), pan_no VARCHAR(20), customer_code VARCHAR(50),
            customer_email VARCHAR(255), referral_id VARCHAR(50),
            purchase_amount DECIMAL(15,2) DEFAULT 0, purchased_product VARCHAR(255),
            product_details TEXT, purchase_date DATE NULL,
            bank_account_name VARCHAR(255), account_no VARCHAR(50), ifsc_code VARCHAR(20),
            bank_name VARCHAR(255), bank_branch VARCHAR(255),
            agent_name VARCHAR(255), agent_id VARCHAR(50),
            place VARCHAR(255) DEFAULT 'Krishnagiri', application_date DATE NULL,
            status ENUM('pending','approved','rejected') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");
    } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE cashback_applications ADD COLUMN cycle_id INT NULL"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE cashback_applications ADD COLUMN gst_amount DECIMAL(15,2) DEFAULT 0"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE cashback_applications ADD COLUMN total_amount DECIMAL(15,2) DEFAULT 0"); } catch (Exception $e) {}

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
    // Category-based GST: precious metals (gold/silver) one rate, all other products another.
    $gold_gst    = isset($settings['gold_gst'])    ? (float)$settings['gold_gst']    : 3;
    $general_gst = isset($settings['general_gst']) ? (float)$settings['general_gst'] : 18;
    $gstRateFor = function ($category) use ($gold_gst, $general_gst) {
        $c = strtolower((string)$category);
        return (strpos($c, 'gold') !== false || strpos($c, 'silver') !== false) ? $gold_gst : $general_gst;
    };

    $asset_type = isset($data->asset_type) ? strtolower($data->asset_type) : 'gold';
    $payment_method = (isset($data->payment_mode) && strtolower($data->payment_mode) === 'upi') ? 'UPI Scan' : 'Bank Transfer';
    $weight = (float)$data->weight;

    // Cart checkout — items JSON array takes priority
    $items_json = isset($data->items) ? $data->items : null;
    $items = $items_json ? json_decode($items_json, true) : null;

    if ($items && count($items) > 0) {
        // Multi-product cart: compute total from DB prices
        $base_amount = 0;
        $gst_amount = 0;
        $product_names = [];
        $valid_product_id = null;
        foreach ($items as $item) {
            $pStmt = $db->prepare("SELECT id, name, price, category FROM products WHERE id = ? AND is_active = 1");
            $pStmt->execute([(int)$item['product_id']]);
            $prod = $pStmt->fetch(PDO::FETCH_ASSOC);
            if ($prod) {
                $qty = max(1, (int)($item['quantity'] ?? 1));
                $line_base = (float)$prod['price'] * $qty;
                $base_amount += $line_base;
                $gst_amount  += $line_base * ($gstRateFor($prod['category']) / 100);
                $product_names[] = $qty . 'x ' . $prod['name'];
                if (!$valid_product_id) $valid_product_id = $prod['id'];
            }
        }
        $total_price = $base_amount + $gst_amount;
        $product_name = implode(', ', $product_names);
        $weight = 1;
        $asset_type = 'product';
    } elseif ($asset_type === 'product' && !empty($data->product_id)) {
        // Single product purchase
        $pStmt = $db->prepare("SELECT id, name, price, category FROM products WHERE id = ? AND is_active = 1");
        $pStmt->execute([(int)$data->product_id]);
        $productRow = $pStmt->fetch(PDO::FETCH_ASSOC);
        if (!$productRow) {
            throw new Exception("Product not found or is currently inactive.");
        }
        $base_price = (float)$productRow['price'];
        $weight = 1;
        $base_amount = $base_price;
        $gst_amount = $base_amount * ($gstRateFor($productRow['category']) / 100);
        $total_price = $base_amount + $gst_amount;
        $product_name = $productRow['name'];
        $valid_product_id = $productRow['id'];
    } else {
        $base_price = ($asset_type === 'silver') ? $silver_base_price : $gold_base_price;
        $base_amount = $base_price * $weight;
        // Raw gold/silver are precious metals → gold GST rate.
        $gst_amount = $base_amount * ($gstRateFor($asset_type) / 100);
        $total_price = $base_amount + $gst_amount;
        $asset_label = ($asset_type === 'silver') ? 'Silver' : '24K Gold';
        $product_name = $weight . " Gram(s) " . $asset_label;
        $valid_product_id = null;
    }

    $min_investment = isset($settings['min_investment']) ? (float)$settings['min_investment'] : 1000;

    if ($asset_type !== 'product' && $total_price < $min_investment) {
        throw new Exception("Minimum investment required is ₹" . number_format($min_investment) . ". Please increase the weight.");
    }

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

    // 3. Guard only against accidental double-submission of the SAME order (rapid double-click).
    //    Customers may have multiple distinct pending orders in the shop.
    $dupCheck = $db->prepare("SELECT id FROM cashback_cycles
                              WHERE user_id = :uid AND status = 'pending'
                              AND total_value = :total
                              AND created_at >= (NOW() - INTERVAL 60 SECOND)");
    $dupCheck->execute(['uid' => $data->user_id, 'total' => $total_price]);
    if ($dupCheck->fetch()) {
        throw new Exception("This order was just submitted. Please wait a moment before retrying.");
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
    $ledgerTxnId = $db->lastInsertId(); // link this ledger entry to the cycle for exact approve/reject/delete

    // 5. Create Cashback Cycle (Pending)
    $daily_rate_setting = isset($settings['daily_cashback_rate']) ? (float)$settings['daily_cashback_rate'] : 1;

    // GST-exclusive cashback breakdown:
    //  customer pays $total_price (incl. GST) but ALL incentives use $base_amount (ex-GST) only.
    $product_amount           = $base_amount;            // subtotal before GST
    $total_amount             = $total_price;            // product + GST (what is actually paid)
    $cashback_eligible_amount = $base_amount;            // GST excluded — the only cashback base

    // Gross daily payout = daily_cashback_rate % of the ex-GST base (matches the yield engine,
    // which credits this less TDS + service charges). Stored so dashboards/reports show the
    // real 1% yield instead of ₹0.
    $daily = round($cashback_eligible_amount * ($daily_rate_setting / 100), 2);

    $cStmt = $db->prepare(
        "INSERT INTO cashback_cycles (user_id, total_value, product_amount, gst_amount, total_amount, cashback_eligible_amount, ledger_txn_id, daily_payout, transaction_id, payment_method, payment_screenshot, asset_type, weight, product_id, product_name, status)
         VALUES (:user_id, :total, :product_amount, :gst_amount, :total_amount, :cashback_eligible, :ledger_txn_id, :daily, :tid, :payment_method, :shot, :asset, :weight, :product_id, :product_name, 'pending')"
    );
    $cStmt->execute([
        'user_id'      => $data->user_id,
        'total'        => $total_price,
        'product_amount'   => $product_amount,
        'gst_amount'       => $gst_amount,
        'total_amount'     => $total_amount,
        'cashback_eligible'=> $cashback_eligible_amount,
        'ledger_txn_id'    => $ledgerTxnId,
        'daily'        => $daily,
        'tid'          => isset($data->transaction_id) ? $data->transaction_id : null,
        'payment_method' => $payment_method,
        'shot'         => $screenshot_path,
        'asset'        => $asset_type,
        'weight'       => $weight,
        'product_id'   => $valid_product_id ?? null,
        'product_name' => $product_name ?? null,
    ]);
    $cycleId = $db->lastInsertId();

    // 5b. Auto-create a Cashback Application from the order (real customer + bank data from DB).
    // GST-exclusive: purchase_amount stored is the ex-GST product value (the cashback base).
    // NOTE: the table/columns are created above (before the transaction) — no DDL here, as DDL
    // would implicitly commit the transaction.
    try {
        $uStmt = $db->prepare("SELECT customer_id, name, email, phone, address, aadhar_no, pan_no, referral_code, bank_name, account_no, ifsc_code, branch_name FROM users WHERE id = ?");
        $uStmt->execute([$data->user_id]);
        $cust = $uStmt->fetch(PDO::FETCH_ASSOC) ?: [];

        $appStmt = $db->prepare("INSERT INTO cashback_applications
            (user_id, cycle_id, customer_name, address, phone, aadhar_no, pan_no, customer_code,
             customer_email, referral_id, purchase_amount, gst_amount, total_amount, purchased_product, product_details,
             purchase_date, bank_account_name, account_no, ifsc_code, bank_name, bank_branch,
             place, application_date, status)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'pending')");
        $appStmt->execute([
            $data->user_id,
            $cycleId,
            $cust['name'] ?? '',
            $cust['address'] ?? '',
            $cust['phone'] ?? ($data->phone ?? ''),
            $cust['aadhar_no'] ?? '',
            $cust['pan_no'] ?? '',
            $cust['customer_id'] ?? '',
            $cust['email'] ?? '',
            $cust['referral_code'] ?? '',
            $cashback_eligible_amount,                          // ex-GST product value = cashback base
            $gst_amount,
            $total_amount,
            $product_name,
            'Auto-generated from order #' . $cycleId . '. Total paid ₹' . number_format($total_amount, 2) . ' incl. GST ₹' . number_format($gst_amount, 2) . '. Cashback eligible ₹' . number_format($cashback_eligible_amount, 2) . ' (GST excluded).',
            date('Y-m-d'),
            $cust['name'] ?? '',
            $cust['account_no'] ?? '',
            $cust['ifsc_code'] ?? '',
            $cust['bank_name'] ?? '',
            $cust['branch_name'] ?? '',
            'Krishnagiri',
            date('Y-m-d'),
        ]);
    } catch (Exception $appErr) { /* Non-critical: order still succeeds */ }

    // 6. Create Agreement (Pending)
    if (!$valid_product_id) {
        $pStmt = $db->query("SELECT id FROM products LIMIT 1");
        $firstProduct = $pStmt->fetch(PDO::FETCH_ASSOC);
        if ($firstProduct) {
            $valid_product_id = $firstProduct['id'];
        } else {
            $db->exec("INSERT INTO products (name, slug, price) VALUES ('Custom Gold Asset', 'custom-gold-asset', 7250)");
            $valid_product_id = $db->lastInsertId();
        }
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

    // Send order submission notification to user
    try {
        $db->prepare("INSERT INTO notifications (user_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, 'success', 0, NOW())")
            ->execute([
                $data->user_id,
                'Order Submitted',
                "Your order for '{$product_name}' (₹" . number_format($total_price, 2) . ") has been submitted and is pending admin approval. Product delivered within 7 working days; payout starts within 48 hours of approval."
            ]);
    } catch (Exception $notifErr) { /* Non-critical */ }

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
