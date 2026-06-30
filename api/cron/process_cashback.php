<?php
// api/cron/process_cashback.php
// Daily 1% yield + 5-level referral processing.
//   • Manual trigger: the admin "Process Daily Yield" button calls this endpoint.
//   • Scheduled trigger: point an OS/cPanel cron at this URL once a day.
// The actual logic lives in daily_yield_engine.php (also auto-invoked lazily on
// dashboard loads), so manual and automatic runs share one idempotent code path.
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

date_default_timezone_set('Asia/Kolkata');

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/daily_yield_engine.php';

$result = run_daily_yield($pdo);
echo json_encode($result);
?>
