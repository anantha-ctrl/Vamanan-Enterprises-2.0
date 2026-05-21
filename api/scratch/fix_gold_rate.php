<?php
require_once '../config.php';
$stmt = $pdo->prepare("UPDATE platform_settings SET config_value = '7850' WHERE config_key = 'gold_base_price'");
if ($stmt->execute()) {
    echo "Gold rate updated to 7850 successfully.\n";
} else {
    echo "Failed to update gold rate.\n";
}
?>
