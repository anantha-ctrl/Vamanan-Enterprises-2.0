<?php
// api/admin/reports.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/db.php';
require_once '../config/migrate.php';

$database = new Database();
$db = $database->getConnection();

$type = isset($_GET['type']) ? $_GET['type'] : 'transaction';
$startDate = isset($_GET['start_date']) ? $_GET['start_date'] : date('Y-m-d', strtotime('-30 days'));
$endDate = isset($_GET['end_date']) ? $_GET['end_date'] : date('Y-m-d');

try {
    $data = [
        "summary" => [],
        "chart" => [],
        "history" => []
    ];

    switch ($type) {
        case 'cashback':
            // Summary
            $stmt = $db->query("SELECT
                COUNT(*) as total_count,
                SUM(amount) as total_amount,
                SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as success_amount,
                SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
                SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN amount ELSE 0 END) as daily_amount,
                SUM(CASE WHEN MONTH(created_at) = MONTH(CURRENT_DATE) AND YEAR(created_at) = YEAR(CURRENT_DATE) THEN amount ELSE 0 END) as monthly_amount,
                SUM(COALESCE(gross_amount, amount)) as gross_amount,
                SUM(COALESCE(tds_amount, 0)) as tds_amount,
                SUM(COALESCE(charges_amount, 0)) as charges_amount,
                SUM(COALESCE(deduction, 0)) as total_deduction,
                SUM(amount) as net_amount
                FROM transactions WHERE category = 'cashback'");
            $data['summary'] = $stmt->fetch(PDO::FETCH_ASSOC);

            // Cycles Summary
            $stmt = $db->query("SELECT 
                COUNT(*) as total_cycles,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_cycles,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_cycles,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_cycles,
                SUM(CASE WHEN status = 'active' THEN daily_payout ELSE 0 END) as daily_liability
                FROM cashback_cycles");
            $data['cycles_summary'] = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // History (Transactions)
            $stmt = $db->prepare("SELECT t.*, u.name as user_name, u.email as user_email FROM transactions t JOIN wallets w ON t.wallet_id = w.id JOIN users u ON w.user_id = u.id WHERE t.category = 'cashback' AND DATE(t.created_at) BETWEEN ? AND ? ORDER BY t.created_at DESC");
            $stmt->execute([$startDate, $endDate]);
            $data['history'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Cycles List
            $stmt = $db->prepare("SELECT c.*, u.name as user_name, u.email as user_email FROM cashback_cycles c JOIN users u ON c.user_id = u.id ORDER BY c.created_at DESC LIMIT 100");
            $stmt->execute();
            $data['cycles'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Chart (Last 15 days)
            $stmt = $db->query("SELECT DATE(created_at) as date, SUM(amount) as total_amount FROM transactions WHERE category = 'cashback' GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 15");
            $data['chart'] = array_reverse($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'withdrawal':
            $stmt = $db->query("SELECT 
                COUNT(*) as total_count, 
                SUM(amount) as total_amount,
                SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as approved_amount,
                SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
                SUM(CASE WHEN status = 'rejected' THEN amount ELSE 0 END) as rejected_amount,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
                FROM transactions WHERE category = 'withdrawal'");
            $data['summary'] = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $stmt = $db->prepare("SELECT t.*, u.name as user_name, u.email as user_email, u.bank_name, u.account_no, u.ifsc_code FROM transactions t JOIN wallets w ON t.wallet_id = w.id JOIN users u ON w.user_id = u.id WHERE t.category = 'withdrawal' AND DATE(t.created_at) BETWEEN ? AND ? ORDER BY t.created_at DESC");
            $stmt->execute([$startDate, $endDate]);
            $data['history'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $stmt = $db->query("SELECT DATE(created_at) as date, SUM(amount) as total_amount FROM transactions WHERE category = 'withdrawal' GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 15");
            $data['chart'] = array_reverse($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'transaction':
            $stmt = $db->query("SELECT COUNT(*) as count, SUM(amount) as total FROM transactions");
            $data['summary'] = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $stmt = $db->prepare("SELECT t.*, u.name as user_name, u.email as user_email FROM transactions t JOIN wallets w ON t.wallet_id = w.id JOIN users u ON w.user_id = u.id WHERE DATE(t.created_at) BETWEEN ? AND ? ORDER BY t.created_at DESC");
            $stmt->execute([$startDate, $endDate]);
            $data['history'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $stmt = $db->query("SELECT DATE(created_at) as date, SUM(amount) as total_amount FROM transactions GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 15");
            $data['chart'] = array_reverse($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'investment':
            $stmt = $db->query("SELECT COUNT(*) as count, SUM(total_value) as total FROM cashback_cycles");
            $data['summary'] = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $stmt = $db->prepare("SELECT c.*, u.name as user_name, u.email as user_email FROM cashback_cycles c JOIN users u ON c.user_id = u.id WHERE DATE(c.created_at) BETWEEN ? AND ? ORDER BY c.created_at DESC");
            $stmt->execute([$startDate, $endDate]);
            $data['history'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $stmt = $db->query("SELECT DATE(created_at) as date, SUM(total_value) as total_amount FROM cashback_cycles GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 15");
            $data['chart'] = array_reverse($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'referral':
            // Summary Stats
            $stmt = $db->query("SELECT
                COUNT(*) as count,
                SUM(t.amount) as total,
                COUNT(DISTINCT w.user_id) as unique_earners,
                SUM(COALESCE(t.gross_amount, t.amount)) as gross_amount,
                SUM(COALESCE(t.tds_amount, 0)) as tds_amount,
                SUM(COALESCE(t.charges_amount, 0)) as charges_amount,
                SUM(COALESCE(t.deduction, 0)) as total_deduction,
                SUM(t.amount) as net_amount
                FROM transactions t JOIN wallets w ON t.wallet_id = w.id WHERE t.category = 'referral'");
            $data['summary'] = $stmt->fetch(PDO::FETCH_ASSOC);

            // Network Growth (Total referrals made)
            $stmt = $db->query("SELECT COUNT(*) as total_network FROM users WHERE referrer_id IS NOT NULL");
            $networkStats = $stmt->fetch(PDO::FETCH_ASSOC);
            $data['summary']['total_network'] = $networkStats['total_network'];
            
            // History
            $stmt = $db->prepare("SELECT t.*, u.name as user_name, u.email as user_email FROM transactions t JOIN wallets w ON t.wallet_id = w.id JOIN users u ON w.user_id = u.id WHERE t.category = 'referral' AND DATE(t.created_at) BETWEEN ? AND ? ORDER BY t.created_at DESC");
            $stmt->execute([$startDate, $endDate]);
            $data['history'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Chart (Daily Referral Earnings)
            $stmt = $db->query("SELECT DATE(created_at) as date, SUM(amount) as total_amount FROM transactions WHERE category = 'referral' GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 15");
            $data['chart'] = array_reverse($stmt->fetchAll(PDO::FETCH_ASSOC));

            // Top Referrers
            $stmt = $db->query("SELECT u.name, u.email, SUM(t.amount) as total_earned, COUNT(t.id) as referrals_count 
                                FROM transactions t 
                                JOIN wallets w ON t.wallet_id = w.id 
                                JOIN users u ON w.user_id = u.id 
                                WHERE t.category = 'referral' 
                                GROUP BY u.id 
                                ORDER BY total_earned DESC 
                                LIMIT 10");
            $data['top_referrers'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Network Growth Over Time
            $stmt = $db->query("SELECT DATE(created_at) as date, COUNT(*) as count 
                                FROM users 
                                WHERE referrer_id IS NOT NULL 
                                GROUP BY DATE(created_at) 
                                ORDER BY date DESC 
                                LIMIT 15");
            $data['growth_chart'] = array_reverse($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'payout':
            // Summary (Successful, Failed, Pending)
            $stmt = $db->query("SELECT 
                COUNT(*) as total_count, 
                SUM(amount) as total_amount,
                SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as success_amount,
                SUM(CASE WHEN status = 'failed' THEN amount ELSE 0 END) as failed_amount,
                SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
                FROM transactions WHERE category = 'payout'");
            $data['summary'] = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // History
            $stmt = $db->prepare("SELECT t.*, u.name as user_name, u.email as user_email, u.bank_name, u.account_no, u.ifsc_code 
                                FROM transactions t 
                                JOIN wallets w ON t.wallet_id = w.id 
                                JOIN users u ON w.user_id = u.id 
                                WHERE t.category = 'payout' AND DATE(t.created_at) BETWEEN ? AND ? 
                                ORDER BY t.created_at DESC");
            $stmt->execute([$startDate, $endDate]);
            $data['history'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Chart (Daily Payout Volume)
            $stmt = $db->query("SELECT DATE(created_at) as date, SUM(amount) as total_amount FROM transactions WHERE category = 'payout' GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 15");
            $data['chart'] = array_reverse($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;
    }

    // Calculate Additional Stats (Real-time Market Efficiency)
    $stmt = $db->query("SELECT COUNT(*) as total, SUM(CASE WHEN status = 'completed' OR status = 'success' THEN 1 ELSE 0 END) as success FROM transactions");
    $globalStats = $stmt->fetch(PDO::FETCH_ASSOC);
    $efficiency = $globalStats['total'] > 0 ? round(($globalStats['success'] / $globalStats['total']) * 100, 1) : 99.2;

    $data['summary']['efficiency'] = $efficiency . '%';
    $data['summary']['registry_count'] = count($data['history']);

    echo json_encode([
        "status" => "success",
        "data" => $data
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
