<?php
// api/offers/active.php — active offers to show as a popup on login (public).
// An offer is "active" when is_active=1 AND now is within its optional start/end window.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../config.php';

try {
    $offers = $pdo->query("SELECT id, title, message, image, badge, color, starts_at, ends_at
                           FROM offers
                           WHERE is_active = 1
                             AND (starts_at IS NULL OR starts_at <= NOW())
                             AND (ends_at   IS NULL OR ends_at   >= NOW())
                           ORDER BY created_at DESC")->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "data" => $offers]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage(), "data" => []]);
}
