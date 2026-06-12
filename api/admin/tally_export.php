<?php
// api/admin/tally_export.php
// Exports cashback applications to Tally (TallyPrime / Tally ERP 9) as XML vouchers.
//
// Modes (GET param `mode`):
//   download (default) - returns a .xml file to import via Gateway of Tally > Import Data
//   preview            - returns the XML inline (text) so you can inspect it
//   push               - POSTs the XML directly to Tally's HTTP gateway (real-time)
//
// Optional filters / settings (GET params):
//   id            - export a single application by id
//   status        - filter by status (pending | approved | rejected)
//   company       - Tally company name (blank = currently open company)
//   sales_ledger  - credit ledger name (default "Sales Account")
//   voucher_type  - Tally voucher type (default "Sales")
//   gateway       - Tally gateway URL for push mode (default http://localhost:9000)

require_once '../config.php';
$db = $pdo;

// Ensure table exists (matches customer/cashback_application.php schema)
$db->exec("CREATE TABLE IF NOT EXISTS cashback_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    customer_name VARCHAR(255),
    address TEXT,
    phone VARCHAR(20),
    aadhar_no VARCHAR(20),
    pan_no VARCHAR(20),
    customer_code VARCHAR(50),
    customer_email VARCHAR(255),
    referral_id VARCHAR(50),
    purchase_amount DECIMAL(15,2) DEFAULT 0,
    purchased_product VARCHAR(255),
    product_details TEXT,
    purchase_date DATE NULL,
    bank_account_name VARCHAR(255),
    account_no VARCHAR(50),
    ifsc_code VARCHAR(20),
    bank_name VARCHAR(255),
    bank_branch VARCHAR(255),
    agent_name VARCHAR(255),
    agent_id VARCHAR(50),
    place VARCHAR(255) DEFAULT 'Krishnagiri',
    application_date DATE NULL,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

$mode         = $_GET['mode'] ?? 'download';
$company      = $_GET['company'] ?? '';
$salesLedger  = $_GET['sales_ledger'] ?? 'Sales Account';
$voucherType  = $_GET['voucher_type'] ?? 'Sales';
$gateway      = $_GET['gateway'] ?? 'http://localhost:9000';

// ---- Fetch applications ----
$where = [];
$params = [];
if (!empty($_GET['id']))     { $where[] = "id = ?";     $params[] = $_GET['id']; }
if (!empty($_GET['status'])) { $where[] = "status = ?"; $params[] = $_GET['status']; }
$sql = "SELECT * FROM cashback_applications";
if ($where) $sql .= " WHERE " . implode(' AND ', $where);
$sql .= " ORDER BY id ASC";
$stmt = $db->prepare($sql);
$stmt->execute($params);
$apps = $stmt->fetchAll(PDO::FETCH_ASSOC);

// ---- Helpers ----
function x($s) { return htmlspecialchars((string)$s, ENT_XML1 | ENT_QUOTES, 'UTF-8'); }
function tallyDate($d) {
    $ts = $d ? strtotime($d) : time();
    if (!$ts) $ts = time();
    return date('Ymd', $ts); // Tally wants YYYYMMDD
}

// ---- Build Tally XML ----
$ledgerMsgs  = '';
$voucherMsgs = '';
$seenLedgers = [];
$total = 0;

foreach ($apps as $a) {
    $custName = trim($a['customer_name']) !== '' ? $a['customer_name'] : ('Customer #' . $a['user_id']);
    $amount   = (float)$a['purchase_amount'];
    $total   += $amount;
    $date     = tallyDate($a['application_date'] ?: ($a['purchase_date'] ?: $a['created_at']));
    $narration = "Cashback application #{$a['id']} - " .
                 ($a['purchased_product'] ?: 'Purchase') .
                 ($a['agent_name'] ? " (Agent: {$a['agent_name']})" : "");

    // Create the customer ledger master once (under Sundry Debtors)
    if (!isset($seenLedgers[$custName])) {
        $seenLedgers[$custName] = true;
        $ledgerMsgs .= '
      <TALLYMESSAGE xmlns:UDF="TallyUDF">
        <LEDGER NAME="' . x($custName) . '" ACTION="Create">
          <PARENT>Sundry Debtors</PARENT>
          <ISBILLWISEON>No</ISBILLWISEON>
          <LEDGERPHONE>' . x($a['phone']) . '</LEDGERPHONE>
          <EMAIL>' . x($a['customer_email']) . '</EMAIL>
          <INCOMETAXNUMBER>' . x($a['pan_no']) . '</INCOMETAXNUMBER>
          <LEDGERMAILINGNAME>' . x($custName) . '</LEDGERMAILINGNAME>
          <MAILINGNAME.LIST><MAILINGNAME>' . x($custName) . '</MAILINGNAME></MAILINGNAME.LIST>
          <ADDRESS.LIST><ADDRESS>' . x($a['address']) . '</ADDRESS></ADDRESS.LIST>
        </LEDGER>
      </TALLYMESSAGE>';
    }

    // Sales voucher: Dr Customer (debtor), Cr Sales
    $voucherMsgs .= '
      <TALLYMESSAGE xmlns:UDF="TallyUDF">
        <VOUCHER VCHTYPE="' . x($voucherType) . '" ACTION="Create" OBJVIEW="Accounting Voucher View">
          <DATE>' . $date . '</DATE>
          <EFFECTIVEDATE>' . $date . '</EFFECTIVEDATE>
          <VOUCHERTYPENAME>' . x($voucherType) . '</VOUCHERTYPENAME>
          <VOUCHERNUMBER>CBA-' . x($a['id']) . '</VOUCHERNUMBER>
          <PARTYLEDGERNAME>' . x($custName) . '</PARTYLEDGERNAME>
          <NARRATION>' . x($narration) . '</NARRATION>
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>' . x($custName) . '</LEDGERNAME>
            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
            <AMOUNT>-' . number_format($amount, 2, '.', '') . '</AMOUNT>
          </ALLLEDGERENTRIES.LIST>
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>' . x($salesLedger) . '</LEDGERNAME>
            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
            <AMOUNT>' . number_format($amount, 2, '.', '') . '</AMOUNT>
          </ALLLEDGERENTRIES.LIST>
        </VOUCHER>
      </TALLYMESSAGE>';
}

$xml = '<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>' . x($company) . '</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>' . $ledgerMsgs . $voucherMsgs . '
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>';

// ---- Output ----
if ($mode === 'push') {
    // Real-time push to Tally HTTP gateway
    header("Content-Type: application/json; charset=UTF-8");
    if (empty($apps)) {
        echo json_encode(["status" => "error", "message" => "No cashback applications to export."]);
        exit;
    }
    $ch = curl_init($gateway);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $xml,
        CURLOPT_HTTPHEADER     => ['Content-Type: text/xml; charset=utf-8'],
        CURLOPT_TIMEOUT        => 30,
    ]);
    $response = curl_exec($ch);
    $err = curl_error($ch);
    curl_close($ch);

    if ($err) {
        echo json_encode([
            "status"  => "error",
            "message" => "Could not reach Tally gateway at $gateway. Is Tally open with the gateway enabled? ($err)"
        ]);
        exit;
    }

    // Tally's response is XML; surface created/error counts
    $created = preg_match('/<CREATED>(\d+)<\/CREATED>/', $response, $m1) ? (int)$m1[1] : null;
    $errors  = preg_match('/<ERRORS>(\d+)<\/ERRORS>/', $response, $m2) ? (int)$m2[1] : null;
    echo json_encode([
        "status"       => "success",
        "message"      => "Sent " . count($apps) . " voucher(s) to Tally.",
        "created"      => $created,
        "errors"       => $errors,
        "total_amount" => $total,
        "tally_raw"    => $response
    ]);
    exit;
}

if ($mode === 'preview') {
    header("Content-Type: text/plain; charset=UTF-8");
    echo $xml;
    exit;
}

// default: download as a .xml file for manual import
header("Content-Type: application/xml; charset=UTF-8");
header('Content-Disposition: attachment; filename="cashback_tally_' . date('Ymd_His') . '.xml"');
echo $xml;
exit;
?>
