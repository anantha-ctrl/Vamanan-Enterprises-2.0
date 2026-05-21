<?php
// fix_all.php
require_once 'config.php';

echo "<h2>Makkal Gold System Sync</h2>";

try {
    // 1. Fix platform_settings
    $pdo->exec("CREATE TABLE IF NOT EXISTS platform_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        config_key VARCHAR(100) UNIQUE NOT NULL,
        config_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");
    
    $defaults = [
        'upi_id' => 'vamanan@upi',
        'company_name' => 'Vamanan Enterprises',
        'gold_base_price' => '7250',
        'gst_percentage' => '3'
    ];
    foreach ($defaults as $k => $v) {
        $stmt = $pdo->prepare("INSERT IGNORE INTO platform_settings (config_key, config_value) VALUES (?, ?)");
        $stmt->execute([$k, $v]);
    }
    echo "✅ Platform Settings Synced.<br>";

    // 2. Fix cashback_cycles
    try { $pdo->exec("ALTER TABLE cashback_cycles ADD COLUMN transaction_id VARCHAR(255) AFTER total_earned"); } catch(Exception $e){}
    try { $pdo->exec("ALTER TABLE cashback_cycles ADD COLUMN payment_screenshot VARCHAR(255) AFTER transaction_id"); } catch(Exception $e){}
    try { $pdo->exec("ALTER TABLE cashback_cycles ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"); } catch(Exception $e){}
    try { $pdo->exec("ALTER TABLE cashback_cycles MODIFY COLUMN status ENUM('active', 'completed', 'paused', 'pending') DEFAULT 'pending'"); } catch(Exception $e){}
    echo "✅ Cashback Cycles Schema Synced.<br>";

    try { $pdo->exec("ALTER TABLE transactions MODIFY COLUMN category ENUM('payout', 'referral', 'manual', 'deposit', 'purchase_request', 'other') DEFAULT 'other'"); } catch(Exception $e){}
    echo "✅ Transactions Enum Synced.<br>";

    // 4. Fix agreements
    $pdo->exec("CREATE TABLE IF NOT EXISTS agreements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        agreement_id VARCHAR(50) UNIQUE,
        product_id INT,
        agreement_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        type VARCHAR(100) DEFAULT 'Investment Deed',
        content LONGTEXT,
        status ENUM('pending', 'ratified', 'verified', 'rejected') DEFAULT 'pending',
        signed_at TIMESTAMP NULL,
        customer_signed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    try { $pdo->exec("ALTER TABLE agreements ADD COLUMN agreement_id VARCHAR(50) UNIQUE AFTER user_id"); } catch(Exception $e){}
    try { $pdo->exec("ALTER TABLE agreements ADD COLUMN product_id INT AFTER user_id"); } catch(Exception $e){}
    try { $pdo->exec("ALTER TABLE agreements ADD COLUMN agreement_date DATETIME DEFAULT CURRENT_TIMESTAMP AFTER product_id"); } catch(Exception $e){}
    try { $pdo->exec("ALTER TABLE agreements ADD COLUMN type VARCHAR(100) DEFAULT 'Investment Deed'"); } catch(Exception $e){}
    try { $pdo->exec("ALTER TABLE agreements MODIFY COLUMN status ENUM('pending', 'ratified', 'verified', 'rejected') DEFAULT 'pending'"); } catch(Exception $e){}
    try { $pdo->exec("ALTER TABLE agreements ADD COLUMN customer_signed_at TIMESTAMP NULL AFTER signed_at"); } catch(Exception $e){}
    try { $pdo->exec("ALTER TABLE agreements ADD COLUMN content LONGTEXT"); } catch(Exception $e){}
    try { $pdo->exec("ALTER TABLE agreements ADD COLUMN signed_at TIMESTAMP NULL"); } catch(Exception $e){}
    try { $pdo->exec("ALTER TABLE agreements ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"); } catch(Exception $e){}
    echo "✅ Agreements Table Synced.<br>";

    // 5. Create upload dir
    $dir = "../uploads/payments/";
    if (!file_exists($dir)) {
        mkdir($dir, 0777, true);
        echo "✅ Upload Directory Created.<br>";
    }

    echo "<br><b>System is Ready!</b>";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage();
}
?>
