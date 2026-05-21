<?php
// api/admin/sync_market_rate.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config.php';

try {
    // Fetch live gold price in INR per Ounce
    $url = "https://api.gold-api.com/price/XAU/INR";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $response = curl_exec($ch);

    if (!$response) {
        throw new Exception("Failed to fetch data from market API");
    }

    $data = json_decode($response, true);
    if (!isset($data['price'])) {
        throw new Exception("Invalid response from market API");
    }

    $pricePerOunce = $data['price'];
    // 1 Ounce = 31.1035 Grams
    $pricePerGram = round($pricePerOunce / 31.1035, 2);

    // Apply Indian Market Premium (approx 10-15% for duties and taxes)
    // Since the API gives spot price, we need to add local premiums
    $finalPrice = round($pricePerGram * 1.12, 2); 

    // Update database
    $stmt = $pdo->prepare("UPDATE platform_settings SET config_value = ? WHERE config_key = 'gold_base_price'");
    $stmt->execute([$finalPrice]);

    echo json_encode([
        "status" => "success",
        "data" => [
            "spot_price" => $pricePerGram,
            "market_price" => $finalPrice,
            "updated_at" => date('Y-m-d H:i:s')
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
