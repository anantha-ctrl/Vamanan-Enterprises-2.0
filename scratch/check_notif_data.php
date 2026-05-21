<?php
require_once '../api/config.php';
try {
    $stmt = $pdo->query("DESCRIBE notifications");
    echo "COLUMNS:\n";
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
    
    $stmt = $pdo->query("SELECT * FROM notifications LIMIT 1");
    echo "\nSAMPLE DATA:\n";
    print_r($stmt->fetch(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo $e->getMessage();
}
?>
