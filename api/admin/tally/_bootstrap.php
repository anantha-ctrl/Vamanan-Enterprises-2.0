<?php
// api/admin/tally/_bootstrap.php
// Shared bootstrap for the Tally Integration Module.
//  - Opens the MySQL (makkal_gold) connection via the project's PDO config
//  - Self-heals the Tally-specific tables (vouchers, audit log, sync log, settings)
//  - Provides shared helpers: ledger builders, financial reports, exporters
//    (Tally XML / Excel / CSV), audit logging and JSON responses.
//
// Every Tally endpoint includes this file first.

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { http_response_code(204); exit(0); }

require_once __DIR__ . '/../../config.php';   // gives us $pdo (database: makkal_gold)
$db = $pdo;

// ---------------------------------------------------------------------------
// 1. Self-healing Tally tables
// ---------------------------------------------------------------------------

// Vouchers managed inside the app (independent of, and pushable to, Tally).
$db->exec("CREATE TABLE IF NOT EXISTS tally_vouchers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    voucher_no VARCHAR(64) NOT NULL,
    voucher_type ENUM('Sales','Purchase','Receipt','Payment','Journal','Contra','Credit Note','Debit Note') DEFAULT 'Journal',
    voucher_date DATE NOT NULL,
    party_ledger VARCHAR(255),
    debit_ledger VARCHAR(255),
    credit_ledger VARCHAR(255),
    amount DECIMAL(15,2) DEFAULT 0,
    narration TEXT,
    reference VARCHAR(128),
    source ENUM('manual','sales','customer','cashback','referral','withdrawal','inventory') DEFAULT 'manual',
    source_id INT DEFAULT NULL,
    sync_status ENUM('draft','posted','synced','error') DEFAULT 'draft',
    tally_guid VARCHAR(128) DEFAULT NULL,
    created_by VARCHAR(128) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)");

// Immutable audit trail for every accounting action.
$db->exec("CREATE TABLE IF NOT EXISTS tally_audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(80) NOT NULL,
    entity VARCHAR(80) NOT NULL,
    entity_id VARCHAR(64) DEFAULT NULL,
    detail TEXT,
    amount DECIMAL(15,2) DEFAULT NULL,
    actor VARCHAR(128) DEFAULT 'system',
    ip VARCHAR(64) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

// One row per push/sync attempt to the Tally gateway.
$db->exec("CREATE TABLE IF NOT EXISTS tally_sync_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    resource VARCHAR(64) NOT NULL,
    gateway VARCHAR(255),
    records INT DEFAULT 0,
    created INT DEFAULT NULL,
    altered INT DEFAULT NULL,
    errors INT DEFAULT NULL,
    amount DECIMAL(15,2) DEFAULT 0,
    status ENUM('success','partial','error') DEFAULT 'success',
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

// Key/value settings for the integration (company, ledger mapping, gateway).
$db->exec("CREATE TABLE IF NOT EXISTS tally_settings (
    skey VARCHAR(64) PRIMARY KEY,
    svalue TEXT
)");

// ---------------------------------------------------------------------------
// 2. Settings helpers (with sensible defaults)
// ---------------------------------------------------------------------------
function tally_settings(PDO $db): array {
    $defaults = [
        'company'          => '',
        'gateway'          => 'http://localhost:9000',
        'sales_ledger'     => 'Sales Account',
        'cashback_ledger'  => 'Cashback Expense',
        'referral_ledger'  => 'Referral Commission',
        'bank_ledger'      => 'Bank Account',
        'debtors_group'    => 'Sundry Debtors',
        'inventory_group'  => 'Gold Stock',
    ];
    $rows = $db->query("SELECT skey, svalue FROM tally_settings")->fetchAll(PDO::FETCH_KEY_PAIR);
    return array_merge($defaults, $rows ?: []);
}

function tally_save_settings(PDO $db, array $kv): void {
    $stmt = $db->prepare("INSERT INTO tally_settings (skey, svalue) VALUES (?, ?)
                          ON DUPLICATE KEY UPDATE svalue = VALUES(svalue)");
    foreach ($kv as $k => $v) { $stmt->execute([$k, (string)$v]); }
}

// ---------------------------------------------------------------------------
// 3. Small utilities
// ---------------------------------------------------------------------------
function json_out($payload): void {
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode($payload);
    exit;
}

function xesc($s): string { return htmlspecialchars((string)$s, ENT_XML1 | ENT_QUOTES, 'UTF-8'); }

function tally_date($d): string {
    $ts = $d ? strtotime((string)$d) : time();
    if (!$ts) $ts = time();
    return date('Ymd', $ts); // Tally wants YYYYMMDD
}

function money($v): string { return number_format((float)$v, 2, '.', ''); }

function audit(PDO $db, string $action, string $entity, $entityId = null, string $detail = '', $amount = null, string $actor = 'admin'): void {
    try {
        $stmt = $db->prepare("INSERT INTO tally_audit_log (action, entity, entity_id, detail, amount, actor, ip)
                              VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$action, $entity, $entityId, $detail, $amount, $actor, $_SERVER['REMOTE_ADDR'] ?? null]);
    } catch (Throwable $e) { /* never let auditing break the request */ }
}

// Resolve date-range filter from query string (defaults: this financial year-ish window).
function date_range(): array {
    $start = $_GET['start_date'] ?? date('Y-m-d', strtotime('-1 year'));
    $end   = $_GET['end_date']   ?? date('Y-m-d');
    return [$start, $end];
}

// ---------------------------------------------------------------------------
// 4. Ledger builders — each returns ['rows' => [...], 'summary' => [...]]
//    Rows share a common shape so the frontend + exporters stay generic:
//      date, ref, particulars, type (Dr/Cr), debit, credit, amount, status, meta
// ---------------------------------------------------------------------------
function build_ledger(PDO $db, string $ledger): array {
    [$start, $end] = date_range();

    switch ($ledger) {
        case 'sales':        return ledger_sales($db, $start, $end);
        case 'customer':     return ledger_customer($db, $start, $end);
        case 'cashback':     return ledger_cashback($db, $start, $end);
        case 'referral':     return ledger_referral($db, $start, $end);
        case 'withdrawal':   return ledger_withdrawal($db, $start, $end);
        case 'inventory':    return ledger_inventory($db, $start, $end);
        default:             return ['rows' => [], 'summary' => ['count' => 0, 'total' => 0]];
    }
}

// Sales Ledger — purchases drive revenue. Sourced from cashback_cycles (each
// cycle is a customer purchase of gold/silver/product) + standalone purchase txns.
function ledger_sales(PDO $db, string $start, string $end): array {
    $rows = [];
    $total = 0;
    $stmt = $db->prepare("SELECT c.id, c.total_value, c.asset_type, c.product_name, c.weight, c.status,
                                 c.created_at, c.transaction_id, u.name AS customer, u.email
                          FROM cashback_cycles c JOIN users u ON c.user_id = u.id
                          WHERE DATE(c.created_at) BETWEEN ? AND ?
                          ORDER BY c.created_at DESC");
    $stmt->execute([$start, $end]);
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $c) {
        $amt = (float)$c['total_value'];
        $total += $amt;
        $item = $c['product_name'] ?: ucfirst($c['asset_type'] ?? 'Asset');
        $rows[] = [
            'date'        => substr($c['created_at'], 0, 10),
            'ref'         => 'SAL-' . $c['id'],
            'particulars' => $c['customer'] . ' — ' . $item . ($c['weight'] > 0 ? " ({$c['weight']}g)" : ''),
            'type'        => 'Cr',
            'debit'       => 0,
            'credit'      => $amt,
            'amount'      => $amt,
            'status'      => $c['status'],
            'meta'        => ['email' => $c['email'], 'txn' => $c['transaction_id']],
        ];
    }
    return ['rows' => $rows, 'summary' => [
        'count' => count($rows), 'total' => $total,
        'label' => 'Total Sales Revenue',
    ]];
}

// Customer Ledger — Sundry Debtors view: balances per customer.
function ledger_customer(PDO $db, string $start, string $end): array {
    $rows = [];
    $total = 0;
    $stmt = $db->query("SELECT u.id, u.name, u.email, u.phone,
                               COALESCE(w.balance,0) AS balance,
                               COALESCE(w.total_earned,0) AS earned,
                               COALESCE(w.total_withdrawn,0) AS withdrawn
                        FROM users u
                        LEFT JOIN wallets w ON w.user_id = u.id
                        WHERE u.role = 'customer'
                        ORDER BY balance DESC");
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $u) {
        $bal = (float)$u['balance'];
        $total += $bal;
        $rows[] = [
            'date'        => date('Y-m-d'),
            'ref'         => 'CUST-' . $u['id'],
            'particulars' => $u['name'] ?: ('Customer #' . $u['id']),
            'type'        => 'Cr',                  // wallet balance is payable to customer
            'debit'       => 0,
            'credit'      => $bal,
            'amount'      => $bal,
            'status'      => $bal > 0 ? 'outstanding' : 'settled',
            'meta'        => ['email' => $u['email'], 'phone' => $u['phone'],
                              'earned' => (float)$u['earned'], 'withdrawn' => (float)$u['withdrawn']],
        ];
    }
    return ['rows' => $rows, 'summary' => [
        'count' => count($rows), 'total' => $total,
        'label' => 'Total Payable to Customers',
    ]];
}

// Cashback Ledger — payouts to customers (expense).
function ledger_cashback(PDO $db, string $start, string $end): array {
    $rows = [];
    $total = 0;
    $stmt = $db->prepare("SELECT t.id, t.amount, t.status, t.description, t.created_at,
                                 u.name AS customer, u.email
                          FROM transactions t
                          JOIN wallets w ON t.wallet_id = w.id
                          JOIN users u ON w.user_id = u.id
                          WHERE t.category = 'cashback' AND DATE(t.created_at) BETWEEN ? AND ?
                          ORDER BY t.created_at DESC");
    $stmt->execute([$start, $end]);
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $t) {
        $amt = (float)$t['amount'];
        $total += $amt;
        $rows[] = [
            'date'        => substr($t['created_at'], 0, 10),
            'ref'         => 'CB-' . $t['id'],
            'particulars' => $t['customer'] . ' — ' . ($t['description'] ?: 'Cashback payout'),
            'type'        => 'Dr',
            'debit'       => $amt,
            'credit'      => 0,
            'amount'      => $amt,
            'status'      => $t['status'],
            'meta'        => ['email' => $t['email']],
        ];
    }
    return ['rows' => $rows, 'summary' => [
        'count' => count($rows), 'total' => $total,
        'label' => 'Total Cashback Paid',
    ]];
}

// Referral Ledger — referral commissions (expense).
function ledger_referral(PDO $db, string $start, string $end): array {
    $rows = [];
    $total = 0;
    $stmt = $db->prepare("SELECT t.id, t.amount, t.status, t.description, t.created_at,
                                 u.name AS earner, u.email
                          FROM transactions t
                          JOIN wallets w ON t.wallet_id = w.id
                          JOIN users u ON w.user_id = u.id
                          WHERE t.category = 'referral' AND DATE(t.created_at) BETWEEN ? AND ?
                          ORDER BY t.created_at DESC");
    $stmt->execute([$start, $end]);
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $t) {
        $amt = (float)$t['amount'];
        $total += $amt;
        $rows[] = [
            'date'        => substr($t['created_at'], 0, 10),
            'ref'         => 'REF-' . $t['id'],
            'particulars' => $t['earner'] . ' — ' . ($t['description'] ?: 'Referral commission'),
            'type'        => 'Dr',
            'debit'       => $amt,
            'credit'      => 0,
            'amount'      => $amt,
            'status'      => $t['status'],
            'meta'        => ['email' => $t['email']],
        ];
    }
    return ['rows' => $rows, 'summary' => [
        'count' => count($rows), 'total' => $total,
        'label' => 'Total Referral Commission',
    ]];
}

// Withdrawal Ledger — money paid out to customers / bank.
function ledger_withdrawal(PDO $db, string $start, string $end): array {
    $rows = [];
    $total = 0;
    $stmt = $db->prepare("SELECT wd.id, wd.amount, wd.status, wd.payment_method, wd.transaction_id, wd.created_at,
                                 u.name AS customer, u.email, u.bank_name, u.account_no, u.ifsc_code
                          FROM withdrawals wd JOIN users u ON wd.user_id = u.id
                          WHERE DATE(wd.created_at) BETWEEN ? AND ?
                          ORDER BY wd.created_at DESC");
    $stmt->execute([$start, $end]);
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $w) {
        $amt = (float)$w['amount'];
        $total += $amt;
        $rows[] = [
            'date'        => substr($w['created_at'], 0, 10),
            'ref'         => 'WD-' . $w['id'],
            'particulars' => $w['customer'] . ' — ' . ($w['payment_method'] ?: 'Withdrawal'),
            'type'        => 'Dr',
            'debit'       => $amt,
            'credit'      => 0,
            'amount'      => $amt,
            'status'      => $w['status'],
            'meta'        => ['email' => $w['email'], 'bank' => $w['bank_name'],
                              'account' => $w['account_no'], 'ifsc' => $w['ifsc_code'],
                              'txn' => $w['transaction_id']],
        ];
    }
    return ['rows' => $rows, 'summary' => [
        'count' => count($rows), 'total' => $total,
        'label' => 'Total Withdrawn',
    ]];
}

// Inventory Ledger — stock items (products) + live gold/silver holdings.
function ledger_inventory(PDO $db, string $start, string $end): array {
    $rows = [];
    $total = 0;
    $stmt = $db->query("SELECT id, name, category, purity, weight, price, is_active, created_at
                        FROM products ORDER BY category, name");
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $p) {
        $val = (float)$p['price'];
        $total += $val;
        $rows[] = [
            'date'        => substr($p['created_at'], 0, 10),
            'ref'         => 'ITM-' . $p['id'],
            'particulars' => $p['name'] . ' — ' . $p['category'] . ($p['purity'] ? " ({$p['purity']})" : ''),
            'type'        => 'Dr',
            'debit'       => $val,
            'credit'      => 0,
            'amount'      => $val,
            'status'      => $p['is_active'] ? 'active' : 'inactive',
            'meta'        => ['category' => $p['category'], 'weight' => (float)$p['weight'],
                              'purity' => $p['purity'], 'unit_price' => $val],
        ];
    }
    return ['rows' => $rows, 'summary' => [
        'count' => count($rows), 'total' => $total,
        'label' => 'Total Stock Value',
    ]];
}

// ---------------------------------------------------------------------------
// 5. Financial reports — Profit & Loss and Balance Sheet
// ---------------------------------------------------------------------------
function report_pnl(PDO $db): array {
    [$start, $end] = date_range();
    $sum = function (string $sql, array $p = []) use ($db) {
        $s = $db->prepare($sql); $s->execute($p);
        return (float)($s->fetchColumn() ?: 0);
    };

    // Revenue
    $sales = $sum("SELECT COALESCE(SUM(total_value),0) FROM cashback_cycles WHERE DATE(created_at) BETWEEN ? AND ?", [$start, $end]);

    // Direct expenses
    $cashback = $sum("SELECT COALESCE(SUM(amount),0) FROM transactions WHERE category='cashback' AND DATE(created_at) BETWEEN ? AND ?", [$start, $end]);
    $referral = $sum("SELECT COALESCE(SUM(amount),0) FROM transactions WHERE category='referral' AND DATE(created_at) BETWEEN ? AND ?", [$start, $end]);

    $income = [
        ['particulars' => 'Sales Revenue (Gold / Asset Purchases)', 'amount' => $sales],
    ];
    $expenses = [
        ['particulars' => 'Cashback Payouts',     'amount' => $cashback],
        ['particulars' => 'Referral Commissions', 'amount' => $referral],
    ];

    $totalIncome   = array_sum(array_column($income, 'amount'));
    $totalExpense  = array_sum(array_column($expenses, 'amount'));
    $grossProfit   = $totalIncome - $totalExpense;

    return [
        'period'        => ['start' => $start, 'end' => $end],
        'income'        => $income,
        'expenses'      => $expenses,
        'total_income'  => $totalIncome,
        'total_expense' => $totalExpense,
        'net_profit'    => $grossProfit,
        'margin'        => $totalIncome > 0 ? round($grossProfit / $totalIncome * 100, 2) : 0,
    ];
}

function report_balance_sheet(PDO $db): array {
    $val = function (string $sql) use ($db) { return (float)($db->query($sql)->fetchColumn() ?: 0); };

    // Assets
    $inventory = $val("SELECT COALESCE(SUM(price),0) FROM products WHERE is_active = 1");
    $sales     = $val("SELECT COALESCE(SUM(total_value),0) FROM cashback_cycles");
    $withdrawn = $val("SELECT COALESCE(SUM(amount),0) FROM withdrawals WHERE status IN ('approved','completed')");
    $payouts   = $val("SELECT COALESCE(SUM(amount),0) FROM transactions WHERE category IN ('cashback','payout','referral')");
    $bank      = $sales - $withdrawn - $payouts;          // crude cash/bank position
    $debtors   = $val("SELECT COALESCE(SUM(GREATEST(balance,0)),0) FROM wallets"); // amount tied up

    // Liabilities
    $walletPayable = $val("SELECT COALESCE(SUM(balance),0) FROM wallets");
    $pendingWd     = $val("SELECT COALESCE(SUM(amount),0) FROM withdrawals WHERE status = 'pending'");

    $assets = [
        ['particulars' => 'Bank / Cash',                 'amount' => $bank],
        ['particulars' => 'Inventory (Stock-in-hand)',   'amount' => $inventory],
        ['particulars' => 'Sundry Debtors',              'amount' => $debtors],
    ];
    $liabilities = [
        ['particulars' => 'Customer Wallet Balances',    'amount' => $walletPayable],
        ['particulars' => 'Pending Withdrawals',         'amount' => $pendingWd],
    ];

    $totalAssets      = array_sum(array_column($assets, 'amount'));
    $totalLiabilities = array_sum(array_column($liabilities, 'amount'));
    $equity           = $totalAssets - $totalLiabilities;   // balancing figure (retained earnings)

    $liabilities[] = ['particulars' => 'Reserves & Surplus (Equity)', 'amount' => $equity];

    return [
        'as_on'             => date('Y-m-d'),
        'assets'            => $assets,
        'liabilities'       => $liabilities,
        'total_assets'      => $totalAssets,
        'total_liabilities' => $totalAssets,   // balanced
        'equity'            => $equity,
        'balanced'          => true,
    ];
}

// ---------------------------------------------------------------------------
// 6. Tally XML builder (works for any ledger's rows)
// ---------------------------------------------------------------------------
function build_tally_xml(array $rows, string $company, string $voucherType, string $counterLedger, string $partyGroup = 'Sundry Debtors'): string {
    $ledgerMsgs = '';
    $voucherMsgs = '';
    $seen = [];

    foreach ($rows as $r) {
        $party  = $r['particulars'];
        $amount = (float)$r['amount'];
        $date   = tally_date($r['date']);
        $isCr   = ($r['type'] ?? 'Cr') === 'Cr';

        if (!isset($seen[$party])) {
            $seen[$party] = true;
            $ledgerMsgs .= '
      <TALLYMESSAGE xmlns:UDF="TallyUDF">
        <LEDGER NAME="' . xesc($party) . '" ACTION="Create">
          <PARENT>' . xesc($partyGroup) . '</PARENT>
          <ISBILLWISEON>No</ISBILLWISEON>
        </LEDGER>
      </TALLYMESSAGE>';
        }

        // Two-legged voucher: party vs counter ledger
        $partyAmt   = $isCr ? '-' . money($amount) : money($amount);
        $counterAmt = $isCr ? money($amount) : '-' . money($amount);
        $voucherMsgs .= '
      <TALLYMESSAGE xmlns:UDF="TallyUDF">
        <VOUCHER VCHTYPE="' . xesc($voucherType) . '" ACTION="Create" OBJVIEW="Accounting Voucher View">
          <DATE>' . $date . '</DATE>
          <EFFECTIVEDATE>' . $date . '</EFFECTIVEDATE>
          <VOUCHERTYPENAME>' . xesc($voucherType) . '</VOUCHERTYPENAME>
          <VOUCHERNUMBER>' . xesc($r['ref']) . '</VOUCHERNUMBER>
          <PARTYLEDGERNAME>' . xesc($party) . '</PARTYLEDGERNAME>
          <NARRATION>' . xesc($r['ref'] . ' ' . $party) . '</NARRATION>
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>' . xesc($party) . '</LEDGERNAME>
            <ISDEEMEDPOSITIVE>' . ($isCr ? 'Yes' : 'No') . '</ISDEEMEDPOSITIVE>
            <AMOUNT>' . $partyAmt . '</AMOUNT>
          </ALLLEDGERENTRIES.LIST>
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>' . xesc($counterLedger) . '</LEDGERNAME>
            <ISDEEMEDPOSITIVE>' . ($isCr ? 'No' : 'Yes') . '</ISDEEMEDPOSITIVE>
            <AMOUNT>' . $counterAmt . '</AMOUNT>
          </ALLLEDGERENTRIES.LIST>
        </VOUCHER>
      </TALLYMESSAGE>';
    }

    return '<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES><SVCURRENTCOMPANY>' . xesc($company) . '</SVCURRENTCOMPANY></STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>' . $ledgerMsgs . $voucherMsgs . '
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>';
}

// CSV from generic ledger rows.
function build_csv(array $rows): string {
    $out = fopen('php://temp', 'r+');
    fputcsv($out, ['Date', 'Reference', 'Particulars', 'Type', 'Debit', 'Credit', 'Status']);
    foreach ($rows as $r) {
        fputcsv($out, [$r['date'], $r['ref'], $r['particulars'], $r['type'] ?? '',
                       money($r['debit'] ?? 0), money($r['credit'] ?? 0), $r['status'] ?? '']);
    }
    rewind($out);
    return stream_get_contents($out);
}

// Excel (SpreadsheetML 2003) — opens natively in Excel, no extra library needed.
function build_excel(array $rows, string $title): string {
    $cells = '';
    $header = ['Date', 'Reference', 'Particulars', 'Type', 'Debit', 'Credit', 'Status'];
    $hCells = '';
    foreach ($header as $h) {
        $hCells .= '<Cell ss:StyleID="hdr"><Data ss:Type="String">' . xesc($h) . '</Data></Cell>';
    }
    foreach ($rows as $r) {
        $cells .= '<Row>'
            . '<Cell><Data ss:Type="String">' . xesc($r['date']) . '</Data></Cell>'
            . '<Cell><Data ss:Type="String">' . xesc($r['ref']) . '</Data></Cell>'
            . '<Cell><Data ss:Type="String">' . xesc($r['particulars']) . '</Data></Cell>'
            . '<Cell><Data ss:Type="String">' . xesc($r['type'] ?? '') . '</Data></Cell>'
            . '<Cell><Data ss:Type="Number">' . money($r['debit'] ?? 0) . '</Data></Cell>'
            . '<Cell><Data ss:Type="Number">' . money($r['credit'] ?? 0) . '</Data></Cell>'
            . '<Cell><Data ss:Type="String">' . xesc($r['status'] ?? '') . '</Data></Cell>'
            . '</Row>';
    }
    return '<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
   <Style ss:ID="hdr"><Font ss:Bold="1"/><Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
     <Font ss:Color="#FFFFFF" ss:Bold="1"/></Style>
 </Styles>
 <Worksheet ss:Name="' . xesc(substr($title, 0, 28)) . '">
   <Table>
     <Row>' . $hCells . '</Row>
     ' . $cells . '
   </Table>
 </Worksheet>
</Workbook>';
}
