<?php
// api/admin/tally/data.php
// Read endpoint for the Tally Integration Module (all GET / JSON).
//   ?resource=dashboard                      → headline metrics for the module
//   ?resource=ledger&ledger=sales|customer|cashback|referral|withdrawal|inventory
//   ?resource=report&report=pnl|balance_sheet
//   ?resource=vouchers                       → managed vouchers list + summary
//   ?resource=audit&limit=N                  → audit trail
//   ?resource=sync_log                       → sync history
//   ?resource=reconciliation                 → app vs Tally posting reconciliation
//   ?resource=settings                       → current integration settings
// Optional date filters: &start_date=YYYY-MM-DD&end_date=YYYY-MM-DD

require_once __DIR__ . '/_bootstrap.php';

try {
    $resource = $_GET['resource'] ?? 'dashboard';

    switch ($resource) {

        case 'dashboard': {
            $val = fn($sql) => (float)($db->query($sql)->fetchColumn() ?: 0);
            $cnt = fn($sql) => (int)($db->query($sql)->fetchColumn() ?: 0);

            $sales     = $val("SELECT COALESCE(SUM(total_value),0) FROM cashback_cycles");
            $cashback  = $val("SELECT COALESCE(SUM(amount),0) FROM transactions WHERE category='cashback'");
            $referral  = $val("SELECT COALESCE(SUM(amount),0) FROM transactions WHERE category='referral'");
            $withdrawn = $val("SELECT COALESCE(SUM(amount),0) FROM withdrawals WHERE status IN ('approved','completed')");
            $inventory = $val("SELECT COALESCE(SUM(price),0) FROM products WHERE is_active=1");
            $payable   = $val("SELECT COALESCE(SUM(balance),0) FROM wallets");

            // 6-month revenue trend
            $trend = [];
            for ($i = 5; $i >= 0; $i--) {
                $m = date('Y-m', strtotime("-$i months"));
                $s = $db->prepare("SELECT COALESCE(SUM(total_value),0) FROM cashback_cycles WHERE DATE_FORMAT(created_at,'%Y-%m') = ?");
                $s->execute([$m]);
                $trend[] = ['month' => date('M', strtotime($m . '-01')), 'amount' => (float)$s->fetchColumn()];
            }

            json_out(['status' => 'success', 'data' => [
                'metrics' => [
                    'sales_revenue'    => $sales,
                    'cashback_paid'    => $cashback,
                    'referral_paid'    => $referral,
                    'withdrawn'        => $withdrawn,
                    'inventory_value'  => $inventory,
                    'customer_payable' => $payable,
                    'net_position'     => $sales - $cashback - $referral - $withdrawn,
                ],
                'counts' => [
                    'vouchers'      => $cnt("SELECT COUNT(*) FROM tally_vouchers"),
                    'synced'        => $cnt("SELECT COUNT(*) FROM tally_vouchers WHERE sync_status='synced'"),
                    'pending_sync'  => $cnt("SELECT COUNT(*) FROM tally_vouchers WHERE sync_status IN ('draft','posted')"),
                    'sync_runs'     => $cnt("SELECT COUNT(*) FROM tally_sync_log"),
                    'audit_entries' => $cnt("SELECT COUNT(*) FROM tally_audit_log"),
                ],
                'trend'    => $trend,
                'settings' => tally_settings($db),
            ]]);
        }

        case 'ledger': {
            $ledger = $_GET['ledger'] ?? 'sales';
            $result = build_ledger($db, $ledger);
            json_out(['status' => 'success', 'ledger' => $ledger,
                      'data' => $result['rows'], 'summary' => $result['summary']]);
        }

        case 'report': {
            $report = $_GET['report'] ?? 'pnl';
            $data = $report === 'balance_sheet' ? report_balance_sheet($db) : report_pnl($db);
            json_out(['status' => 'success', 'report' => $report, 'data' => $data]);
        }

        case 'vouchers': {
            $where = [];
            $params = [];
            if (!empty($_GET['type']))   { $where[] = 'voucher_type = ?'; $params[] = $_GET['type']; }
            if (!empty($_GET['status'])) { $where[] = 'sync_status = ?';  $params[] = $_GET['status']; }
            $sql = "SELECT * FROM tally_vouchers";
            if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
            $sql .= ' ORDER BY voucher_date DESC, id DESC LIMIT 500';
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $total = array_sum(array_map(fn($r) => (float)$r['amount'], $rows));
            json_out(['status' => 'success', 'data' => $rows,
                      'summary' => ['count' => count($rows), 'total' => $total]]);
        }

        case 'audit': {
            $limit = min(1000, max(1, (int)($_GET['limit'] ?? 200)));
            $stmt = $db->query("SELECT * FROM tally_audit_log ORDER BY id DESC LIMIT $limit");
            json_out(['status' => 'success', 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }

        case 'sync_log': {
            $stmt = $db->query("SELECT * FROM tally_sync_log ORDER BY id DESC LIMIT 200");
            json_out(['status' => 'success', 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }

        case 'reconciliation': {
            // Compare what *should* be posted (source records) against managed/synced vouchers.
            $sources = [
                'sales'      => "SELECT COUNT(*) c, COALESCE(SUM(total_value),0) a FROM cashback_cycles",
                'cashback'   => "SELECT COUNT(*) c, COALESCE(SUM(amount),0) a FROM transactions WHERE category='cashback'",
                'referral'   => "SELECT COUNT(*) c, COALESCE(SUM(amount),0) a FROM transactions WHERE category='referral'",
                'withdrawal' => "SELECT COUNT(*) c, COALESCE(SUM(amount),0) a FROM withdrawals",
            ];
            $rows = [];
            foreach ($sources as $name => $sql) {
                $src = $db->query($sql)->fetch(PDO::FETCH_ASSOC);
                $vch = $db->prepare("SELECT COUNT(*) c, COALESCE(SUM(amount),0) a,
                                     SUM(sync_status='synced') synced FROM tally_vouchers WHERE source = ?");
                $vch->execute([$name]);
                $v = $vch->fetch(PDO::FETCH_ASSOC);
                $diff = (int)$src['c'] - (int)$v['c'];
                $rows[] = [
                    'ledger'        => $name,
                    'source_count'  => (int)$src['c'],
                    'source_amount' => (float)$src['a'],
                    'posted_count'  => (int)$v['c'],
                    'posted_amount' => (float)$v['a'],
                    'synced_count'  => (int)$v['synced'],
                    'unposted'      => $diff,
                    'status'        => $diff === 0 ? 'reconciled' : 'pending',
                ];
            }
            json_out(['status' => 'success', 'data' => $rows]);
        }

        case 'settings': {
            json_out(['status' => 'success', 'data' => tally_settings($db)]);
        }

        default:
            http_response_code(400);
            json_out(['status' => 'error', 'message' => "Unknown resource: $resource"]);
    }
} catch (Throwable $e) {
    http_response_code(500);
    json_out(['status' => 'error', 'message' => $e->getMessage()]);
}
