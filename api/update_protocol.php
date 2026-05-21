<?php
require_once 'config.php';
$rates = [
    'referral_commission_l1' => '0.2',
    'referral_commission_l2' => '0.1',
    'referral_commission_l3' => '0.1',
    'referral_commission_l4' => '0.05',
    'referral_commission_l5' => '0.05'
];

foreach ($rates as $key => $val) {
    $stmt = $pdo->prepare("INSERT INTO platform_settings (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?");
    $stmt->execute([$key, $val, $val]);
}

echo "Protocol Updated Successfully.";
?>
