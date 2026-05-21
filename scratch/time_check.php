<?php
require_once 'api/config.php';
echo "PHP Time: " . date('Y-m-d H:i:s') . "\n";
$res = $pdo->query("SELECT NOW() as mysql_now")->fetch();
echo "MySQL Time: " . $res['mysql_now'] . "\n";
?>
