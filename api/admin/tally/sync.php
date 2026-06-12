<?php
// api/admin/tally/sync.php
// Real-time push of a ledger (or all managed vouchers) into TallyPrime / ERP via
// its HTTP XML gateway. Records every attempt in tally_sync_log + audit trail.
//
// POST JSON: { resource: 'ledger'|'vouchers', ledger: 'sales', gateway?: '...' }

require_once __DIR__ . '/_bootstrap.php';

$body = json_decode(file_get_contents('php://input'), true) ?: [];

try {
    $settings = tally_settings($db);
    $resource = $body['resource'] ?? 'ledger';
    $gateway  = $body['gateway'] ?? $settings['gateway'];
    $actor    = $body['actor'] ?? 'admin';

    // Build the rows + XML for the chosen resource (mirrors export.php mapping).
    if ($resource === 'vouchers') {
        $vouchers = $db->query("SELECT * FROM tally_vouchers WHERE sync_status IN ('draft','posted')")
                       ->fetchAll(PDO::FETCH_ASSOC);
        $rows = array_map(fn($v) => [
            'date' => $v['voucher_date'], 'ref' => $v['voucher_no'],
            'particulars' => $v['party_ledger'] ?: $v['narration'],
            'type' => $v['voucher_type'] === 'Sales' ? 'Cr' : 'Dr',
            'amount' => $v['amount'],
        ], $vouchers);
        $voucherType = 'Journal';
        $counter = $settings['sales_ledger'];
        $ledger = 'vouchers';
    } else {
        $ledger = $body['ledger'] ?? 'sales';
        $result = build_ledger($db, $ledger);
        $rows = $result['rows'];
        $map = [
            'sales' => ['Sales', $settings['sales_ledger']],
            'customer' => ['Receipt', $settings['bank_ledger']],
            'cashback' => ['Payment', $settings['cashback_ledger']],
            'referral' => ['Payment', $settings['referral_ledger']],
            'withdrawal' => ['Payment', $settings['bank_ledger']],
            'inventory' => ['Journal', $settings['inventory_group']],
        ];
        [$voucherType, $counter] = $map[$ledger] ?? ['Journal', 'Suspense'];
    }

    $amount = array_sum(array_map(fn($r) => (float)$r['amount'], $rows));

    if (empty($rows)) {
        json_out(['status' => 'error', 'message' => 'Nothing to sync for ' . $ledger]);
    }

    $xml = build_tally_xml($rows, $settings['company'], $voucherType, $counter, $settings['debtors_group']);

    // ---- POST to the Tally gateway ----
    $ch = curl_init($gateway);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $xml,
        CURLOPT_HTTPHEADER     => ['Content-Type: text/xml; charset=utf-8'],
        CURLOPT_TIMEOUT        => 40,
    ]);
    $response = curl_exec($ch);
    $curlErr  = curl_error($ch);
    curl_close($ch);

    $logSync = function ($status, $message, $created = null, $altered = null, $errors = null)
                use ($db, $ledger, $gateway, $rows, $amount) {
        $stmt = $db->prepare("INSERT INTO tally_sync_log
            (resource, gateway, records, created, altered, errors, amount, status, message)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$ledger, $gateway, count($rows), $created, $altered, $errors, $amount, $status, $message]);
    };

    if ($curlErr) {
        $msg = "Could not reach Tally gateway at $gateway. Is TallyPrime open with the gateway enabled on this port? ($curlErr)";
        $logSync('error', $msg);
        audit($db, 'sync.fail', $ledger, null, $msg, $amount, $actor);
        json_out(['status' => 'error', 'message' => $msg]);
    }

    $created = preg_match('/<CREATED>(\d+)<\/CREATED>/', $response, $m1) ? (int)$m1[1] : null;
    $altered = preg_match('/<ALTERED>(\d+)<\/ALTERED>/', $response, $m2) ? (int)$m2[1] : null;
    $errors  = preg_match('/<ERRORS>(\d+)<\/ERRORS>/', $response, $m3) ? (int)$m3[1] : null;

    $status = ($errors && $errors > 0) ? 'partial' : 'success';
    $message = "Sent " . count($rows) . " voucher(s) to Tally. Created: " . ($created ?? '?') . ", Errors: " . ($errors ?? 0);
    $logSync($status, $message, $created, $altered, $errors);

    // Mark managed vouchers as synced when we pushed the vouchers resource cleanly.
    if ($ledger === 'vouchers' && $status === 'success') {
        $db->exec("UPDATE tally_vouchers SET sync_status='synced' WHERE sync_status IN ('draft','posted')");
    }

    audit($db, 'sync', $ledger, null, $message, $amount, $actor);

    json_out([
        'status'   => 'success',
        'message'  => $message,
        'created'  => $created,
        'altered'  => $altered,
        'errors'   => $errors,
        'records'  => count($rows),
        'amount'   => $amount,
        'tally_raw'=> $response,
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    json_out(['status' => 'error', 'message' => $e->getMessage()]);
}
