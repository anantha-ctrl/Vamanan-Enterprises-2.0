<?php
// api/admin/delete_investment.php
// Delete a purchase / investment record (cashback cycle) and its linked artifacts.
// POST JSON: { cycle_id }
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

require_once '../config.php';
$db = $pdo;

$data = json_decode(file_get_contents("php://input"), true) ?: [];
$cycleId = isset($data['cycle_id']) ? (int)$data['cycle_id'] : 0;

if (!$cycleId) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "cycle_id is required"]);
    exit;
}

try {
    $info = $db->prepare("SELECT user_id, product_name, total_value, ledger_txn_id FROM cashback_cycles WHERE id = ?");
    $info->execute([$cycleId]);
    $cycle = $info->fetch(PDO::FETCH_ASSOC);
    if (!$cycle) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Record not found or already deleted."]);
        exit;
    }

    $db->beginTransaction();

    // Remove the linked purchase transaction so dashboard revenue updates in real time.
    // Prefer the exact ledger transaction; fall back to wallet + amount for legacy records.
    if (!empty($cycle['ledger_txn_id'])) {
        $db->prepare("DELETE FROM transactions WHERE id = ?")->execute([$cycle['ledger_txn_id']]);
    } else {
        $wid = $db->prepare("SELECT id FROM wallets WHERE user_id = ?");
        $wid->execute([$cycle['user_id']]);
        $walletId = $wid->fetchColumn();
        if ($walletId) {
            $db->prepare("DELETE FROM transactions
                          WHERE wallet_id = :wid AND category = 'purchase_request' AND amount = :amt
                          ORDER BY id DESC LIMIT 1")
               ->execute(['wid' => $walletId, 'amt' => $cycle['total_value']]);
        }
    }

    // Remove the linked auto-generated cashback application (if the column exists).
    try { $db->prepare("DELETE FROM cashback_applications WHERE cycle_id = ?")->execute([$cycleId]); } catch (Exception $e) {}

    // Remove the cycle itself.
    $db->prepare("DELETE FROM cashback_cycles WHERE id = ?")->execute([$cycleId]);

    $db->commit();

    echo json_encode([
        "status"  => "success",
        "message" => "Purchase record #$cycleId deleted.",
        "cycle_id" => $cycleId,
    ]);
} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
