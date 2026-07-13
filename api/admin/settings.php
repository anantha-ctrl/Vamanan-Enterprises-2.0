<?php
// api/admin/settings.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Expires: 0");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require_once '../config.php';
$db = $pdo;

try {
    // Auto-create settings table if it doesn't exist
    $db->exec("CREATE TABLE IF NOT EXISTS platform_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        config_key VARCHAR(100) UNIQUE NOT NULL,
        config_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    // Initialize default settings if table is empty
    $defaults = [
        'referral_commission_l1' => '1',
        'referral_commission_l2' => '0.1',
        'referral_commission_l3' => '0.1',
        'referral_commission_l4' => '0.05',
        'referral_commission_l5' => '0.05',
        'min_withdrawal' => '500',
        'gold_base_price' => '7850',
        'silver_base_price' => '100',
        'gst_percentage' => '3',
        'gold_gst' => '3',
        'general_gst' => '18',
        'maintenance_mode' => '0',
        'payout_processing_fee' => '10',
        'daily_cashback_rate' => '1',
        // Incentive deductions (applied to daily cashback + referral commissions).
        // Configurable independently; total withheld = tds_rate + service_charge_rate.
        'tds_rate' => '5',
        'service_charge_rate' => '5',
        'tds_charges_rate' => '10', // legacy combined key (kept for backward compatibility)
        'min_investment' => '1000',
        'support_phone' => '+91 90000 00000',
        'support_email' => 'support@makkalgold.com',
        'company_name' => 'Vamanan Enterprises',
        'company_address' => '123, Gold Plaza, Main Road, City, State, 600001',
        'upi_id' => 'vamanan@upi',
        'bank_name' => 'State Bank of India',
        'bank_account_name' => 'Vamanan Enterprises',
        'bank_account_no' => '123456789012',
        'bank_ifsc' => 'SBIN0001234',
        'bank_branch' => 'Main Branch'
    ];

    foreach ($defaults as $key => $val) {
        $stmt = $db->prepare("INSERT IGNORE INTO platform_settings (config_key, config_value) VALUES (?, ?)");
        $stmt->execute([$key, $val]);
    }

    $protectedNonEmpty = [
        'upi_id',
        'bank_name',
        'bank_account_name',
        'bank_account_no',
        'bank_ifsc',
        'bank_branch'
    ];

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!is_array($data)) {
            $data = [];
        }

        $upsert = $db->prepare(
            "INSERT INTO platform_settings (config_key, config_value)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)"
        );

        foreach ($data as $key => $val) {
            $value = is_scalar($val) ? trim((string)$val) : '';

            // Avoid accidental wipe of gateway details from empty payload values.
            if (in_array($key, $protectedNonEmpty, true) && $value === '') {
                continue;
            }

            $upsert->execute([$key, $value]);
        }
    }

    $stmt = $db->query("SELECT config_key, config_value FROM platform_settings");
    $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

    // Guarantee usable gateway values even if DB has stale empty strings.
    foreach ($protectedNonEmpty as $k) {
        if (!isset($settings[$k]) || trim((string)$settings[$k]) === '') {
            $settings[$k] = $defaults[$k];
            $upsertFill = $db->prepare(
                "INSERT INTO platform_settings (config_key, config_value)
                 VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)"
            );
            $upsertFill->execute([$k, $defaults[$k]]);
        }
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        echo json_encode([
            "status" => "success",
            "message" => "Settings updated successfully",
            "data" => $settings
        ]);
    } else {
        echo json_encode(["status" => "success", "data" => $settings]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
