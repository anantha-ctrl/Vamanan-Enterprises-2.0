<?php
// We can't easily call it via HTTP from PHP without curl or file_get_contents with full URL.
// I'll just include it and capture the output.
$_GET['user_id'] = 6;
ob_start();
include '../api/customer/cashback_plan.php';
$output = ob_get_clean();
echo $output;
?>
