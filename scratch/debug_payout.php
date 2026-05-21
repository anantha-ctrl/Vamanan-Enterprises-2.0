<?php
$_GET['user_id'] = 7; // Leo Raj
try {
    include 'c:/xampp3.0/htdocs/Makkal_Gold/api/admin/get_user_daily_payout.php';
} catch (Throwable $e) {
    echo "\nFATAL ERROR: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine();
}
?>
