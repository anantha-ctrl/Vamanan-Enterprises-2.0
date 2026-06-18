<?php
// api/admin/bulk_upload_products.php
// Bulk product upload via CSV. Parses the uploaded file and inserts each row into
// the products table (makkal_gold MySQL DB), generating a VEVP### code per product.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

require_once '../config.php';
$db = $pdo;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit;
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["status" => "error", "message" => "No CSV file uploaded."]);
    exit;
}

$tmp = $_FILES['file']['tmp_name'];
$handle = fopen($tmp, 'r');
if (!$handle) {
    echo json_encode(["status" => "error", "message" => "Could not read the uploaded file."]);
    exit;
}

// Read & normalise the header row
$header = fgetcsv($handle);
if (!$header) {
    fclose($handle);
    echo json_encode(["status" => "error", "message" => "The file appears to be empty."]);
    exit;
}
// strip BOM from first header cell
$header[0] = preg_replace('/^\xEF\xBB\xBF/', '', $header[0]);
$cols = [];
foreach ($header as $i => $h) {
    $cols[strtolower(trim($h))] = $i;
}

$get = function ($row, $key) use ($cols) {
    return isset($cols[$key]) && isset($row[$cols[$key]]) ? trim($row[$cols[$key]]) : '';
};

if (!isset($cols['name']) || !isset($cols['price'])) {
    fclose($handle);
    echo json_encode(["status" => "error", "message" => "CSV must include at least 'name' and 'price' columns."]);
    exit;
}

try {
    // Next VEVP### sequence (computed once, incremented per insert)
    $seq = (int)$db->query("SELECT COALESCE(MAX(CAST(SUBSTRING(product_code, 5) AS UNSIGNED)), 0) FROM products WHERE product_code LIKE 'VEVP%'")->fetchColumn();

    $insert = $db->prepare("INSERT INTO products
        (product_code, name, category, slug, weight, purity, price, description, is_active, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,NOW(),NOW())");

    $inserted = 0;
    $errors = [];
    $rowNum = 1; // header is row 1

    while (($row = fgetcsv($handle)) !== false) {
        $rowNum++;
        // skip fully blank lines
        if (count(array_filter($row, fn($v) => trim((string)$v) !== '')) === 0) continue;

        $name  = $get($row, 'name');
        $price = $get($row, 'price');

        if ($name === '' || $price === '' || !is_numeric($price)) {
            $errors[] = "Row $rowNum: missing/invalid name or price — skipped.";
            continue;
        }

        $category    = $get($row, 'category') ?: 'Gold';
        $weight      = is_numeric($get($row, 'weight')) ? (float)$get($row, 'weight') : 0;
        $purity      = $get($row, 'purity') ?: '24K';
        $description = $get($row, 'description');
        $isActiveRaw = strtolower($get($row, 'is_active'));
        $isActive    = in_array($isActiveRaw, ['0', 'no', 'false', 'inactive'], true) ? 0 : 1;

        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $name))) . '-' . uniqid();
        $code = 'VEVP' . str_pad(++$seq, 3, '0', STR_PAD_LEFT);

        try {
            $insert->execute([$code, $name, $category, $slug, $weight, $purity, (float)$price, $description, $isActive]);
            $inserted++;
        } catch (PDOException $e) {
            $seq--; // free the code for the next row since this insert failed
            $errors[] = "Row $rowNum ($name): " . $e->getMessage();
        }
    }
    fclose($handle);

    echo json_encode([
        "status"   => "success",
        "message"  => "$inserted product(s) imported successfully.",
        "inserted" => $inserted,
        "errors"   => $errors,
    ]);
} catch (Exception $e) {
    if (is_resource($handle)) fclose($handle);
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
