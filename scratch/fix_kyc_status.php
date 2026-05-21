<?php
require_once 'c:/xampp3.0/htdocs/Makkal_Gold/api/config.php';
try {
    // Update existing users who are 'pending' but have no document to 'none'
    $stmt = $pdo->prepare("UPDATE users SET kyc_status = 'none' WHERE kyc_status = 'pending' AND (kyc_document IS NULL OR kyc_document = '')");
    $stmt->execute();
    echo "Updated " . $stmt->rowCount() . " users to 'none' status.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
