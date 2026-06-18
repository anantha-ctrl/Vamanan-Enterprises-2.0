<?php
// api/admin/tally/export.php
// File export for any ledger / vouchers in Tally XML, Excel (SpreadsheetML) or CSV.
//   ?resource=ledger&ledger=sales&format=xml|excel|csv
//   ?resource=vouchers&format=xml|excel|csv
//   ?mode=preview   → return XML inline as text instead of a download
// Optional date filters apply to ledgers.

require_once __DIR__ . '/_bootstrap.php';

try {
    $resource = $_GET['resource'] ?? 'ledger';
    $format   = strtolower($_GET['format'] ?? 'xml');
    $mode     = $_GET['mode'] ?? 'download';
    $settings = tally_settings($db);

    // ---- Gather rows + a human title for the chosen resource ----
    if ($resource === 'vouchers') {
        $stmt = $db->query("SELECT * FROM tally_vouchers ORDER BY voucher_date DESC, id DESC");
        $vouchers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $rows = array_map(fn($v) => [
            'date' => $v['voucher_date'], 'ref' => $v['voucher_no'],
            'particulars' => $v['party_ledger'] ?: $v['narration'],
            'type' => $v['voucher_type'] === 'Sales' ? 'Cr' : 'Dr',
            'debit' => $v['voucher_type'] === 'Sales' ? 0 : $v['amount'],
            'credit' => $v['voucher_type'] === 'Sales' ? $v['amount'] : 0,
            'amount' => $v['amount'], 'status' => $v['sync_status'],
        ], $vouchers);
        $title = 'Vouchers';
        $voucherType = 'Journal';
        $counter = $settings['sales_ledger'];
    } else {
        $ledger = $_GET['ledger'] ?? 'sales';
        $result = build_ledger($db, $ledger);
        $rows = $result['rows'];
        $title = ucfirst($ledger) . ' Ledger';
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

    $stamp = date('Ymd_His');
    $slug = preg_replace('/[^a-z0-9]+/i', '_', strtolower($title));

    audit($db, 'export', $resource, $_GET['ledger'] ?? $resource, "Exported $title as $format (" . count($rows) . " rows)", null, $_GET['actor'] ?? 'admin');

    if ($format === 'csv') {
        header('Content-Type: text/csv; charset=UTF-8');
        header("Content-Disposition: attachment; filename=\"{$slug}_{$stamp}.csv\"");
        echo build_csv($rows);
        exit;
    }

    if ($format === 'excel') {
        header('Content-Type: application/vnd.ms-excel; charset=UTF-8');
        header("Content-Disposition: attachment; filename=\"{$slug}_{$stamp}.xls\"");
        echo build_excel($rows, $title);
        exit;
    }

    // default: Tally XML — sales uses a GST-aware voucher (Sales ex-GST + CGST/SGST output tax).
    if ($resource !== 'vouchers' && ($_GET['ledger'] ?? 'sales') === 'sales') {
        $xml = build_sales_tally_xml($rows, $settings['company'], $settings['sales_ledger'],
            $settings['cgst_ledger'], $settings['sgst_ledger'], $settings['debtors_group']);
    } else {
        $xml = build_tally_xml($rows, $settings['company'], $voucherType, $counter, $settings['debtors_group']);
    }
    if ($mode === 'preview') {
        header('Content-Type: text/plain; charset=UTF-8');
        echo $xml;
        exit;
    }
    header('Content-Type: application/xml; charset=UTF-8');
    header("Content-Disposition: attachment; filename=\"{$slug}_tally_{$stamp}.xml\"");
    echo $xml;
    exit;

} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
