<?php
// api/admin/tally/vouchers.php
// Voucher management + settings persistence (POST / JSON body).
//   { action: 'create', ...voucherFields }
//   { action: 'update', id, ...voucherFields }
//   { action: 'delete', id }
//   { action: 'post',   id }            → mark a draft voucher as posted
//   { action: 'generate', source }      → auto-build draft vouchers from a ledger
//   { action: 'save_settings', settings: {...} }

require_once __DIR__ . '/_bootstrap.php';

$body = json_decode(file_get_contents('php://input'), true) ?: [];
$action = $body['action'] ?? ($_POST['action'] ?? '');
$actor  = $body['actor'] ?? 'admin';

try {
    switch ($action) {

        case 'create':
        case 'update': {
            $fields = [
                'voucher_no'   => $body['voucher_no']   ?? ('JV-' . date('ymdHis')),
                'voucher_type' => $body['voucher_type'] ?? 'Journal',
                'voucher_date' => $body['voucher_date'] ?? date('Y-m-d'),
                'party_ledger' => $body['party_ledger'] ?? '',
                'debit_ledger' => $body['debit_ledger'] ?? '',
                'credit_ledger'=> $body['credit_ledger']?? '',
                'amount'       => (float)($body['amount'] ?? 0),
                'narration'    => $body['narration']    ?? '',
                'reference'    => $body['reference']    ?? '',
                'source'       => $body['source']       ?? 'manual',
            ];

            if ($action === 'update' && !empty($body['id'])) {
                $set = implode(', ', array_map(fn($k) => "$k = :$k", array_keys($fields)));
                $stmt = $db->prepare("UPDATE tally_vouchers SET $set WHERE id = :id");
                $stmt->execute($fields + ['id' => (int)$body['id']]);
                audit($db, 'voucher.update', 'voucher', $body['id'], $fields['voucher_no'], $fields['amount'], $actor);
                json_out(['status' => 'success', 'message' => 'Voucher updated', 'id' => (int)$body['id']]);
            }

            $cols = array_keys($fields);
            $stmt = $db->prepare("INSERT INTO tally_vouchers (" . implode(',', $cols) . ", created_by, sync_status)
                                  VALUES (:" . implode(',:', $cols) . ", :created_by, 'draft')");
            $stmt->execute($fields + ['created_by' => $actor]);
            $id = $db->lastInsertId();
            audit($db, 'voucher.create', 'voucher', $id, $fields['voucher_no'], $fields['amount'], $actor);
            json_out(['status' => 'success', 'message' => 'Voucher created', 'id' => (int)$id]);
        }

        case 'delete': {
            $id = (int)($body['id'] ?? 0);
            $db->prepare("DELETE FROM tally_vouchers WHERE id = ?")->execute([$id]);
            audit($db, 'voucher.delete', 'voucher', $id, 'Voucher removed', null, $actor);
            json_out(['status' => 'success', 'message' => 'Voucher deleted']);
        }

        case 'post': {
            $id = (int)($body['id'] ?? 0);
            $db->prepare("UPDATE tally_vouchers SET sync_status='posted' WHERE id=? AND sync_status='draft'")->execute([$id]);
            audit($db, 'voucher.post', 'voucher', $id, 'Marked posted', null, $actor);
            json_out(['status' => 'success', 'message' => 'Voucher posted']);
        }

        // Auto-generate draft vouchers from a source ledger (skips already-generated rows).
        case 'generate': {
            $source = $body['source'] ?? 'sales';
            $result = build_ledger($db, $source);
            $existing = $db->prepare("SELECT reference FROM tally_vouchers WHERE source = ?");
            $existing->execute([$source]);
            $have = array_flip($existing->fetchAll(PDO::FETCH_COLUMN));

            $settings = tally_settings($db);
            $counterMap = [
                'sales'      => ['type' => 'Sales',   'counter' => $settings['sales_ledger']],
                'customer'   => ['type' => 'Receipt', 'counter' => $settings['bank_ledger']],
                'cashback'   => ['type' => 'Payment', 'counter' => $settings['cashback_ledger']],
                'referral'   => ['type' => 'Payment', 'counter' => $settings['referral_ledger']],
                'withdrawal' => ['type' => 'Payment', 'counter' => $settings['bank_ledger']],
                'inventory'  => ['type' => 'Journal', 'counter' => $settings['inventory_group']],
            ];
            $cfg = $counterMap[$source] ?? ['type' => 'Journal', 'counter' => 'Suspense'];

            $ins = $db->prepare("INSERT INTO tally_vouchers
                (voucher_no, voucher_type, voucher_date, party_ledger, credit_ledger, debit_ledger,
                 amount, narration, reference, source, sync_status, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)");

            $created = 0;
            foreach ($result['rows'] as $r) {
                if (isset($have[$r['ref']]) || (float)$r['amount'] == 0) continue;
                $isCr = ($r['type'] ?? 'Cr') === 'Cr';
                $ins->execute([
                    $r['ref'], $cfg['type'], $r['date'], $r['particulars'],
                    $isCr ? $cfg['counter'] : $r['particulars'],
                    $isCr ? $r['particulars'] : $cfg['counter'],
                    $r['amount'], $r['particulars'], $r['ref'], $source, $actor,
                ]);
                $created++;
            }
            audit($db, 'voucher.generate', $source, null, "Generated $created vouchers", $result['summary']['total'] ?? null, $actor);
            json_out(['status' => 'success', 'message' => "Generated $created draft voucher(s)", 'created' => $created]);
        }

        case 'save_settings': {
            $allowed = ['company','gateway','sales_ledger','cgst_ledger','sgst_ledger','cashback_ledger','referral_ledger',
                        'bank_ledger','debtors_group','inventory_group'];
            $kv = array_intersect_key($body['settings'] ?? [], array_flip($allowed));
            tally_save_settings($db, $kv);
            audit($db, 'settings.save', 'settings', null, 'Integration settings updated', null, $actor);
            json_out(['status' => 'success', 'message' => 'Settings saved', 'data' => tally_settings($db)]);
        }

        default:
            http_response_code(400);
            json_out(['status' => 'error', 'message' => "Unknown action: $action"]);
    }
} catch (Throwable $e) {
    http_response_code(500);
    json_out(['status' => 'error', 'message' => $e->getMessage()]);
}
