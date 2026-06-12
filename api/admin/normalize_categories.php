<?php
// api/admin/normalize_categories.php
// One-shot cleanup: re-maps every product into one of the six canonical
// categories and removes all other (legacy / duplicate) category labels so the
// catalog, the Shop, and the Tally Inventory Ledger all speak the same six.
// Non-destructive to products — only their `category` label is normalized.
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require_once '../config.php';
$db = $pdo;

// The only categories we keep.
$canonical = [
    'Gold'                          => 'gold',
    'House Construction'            => 'house-construction',
    'All Construction Material'     => 'all-construction-material',
    'Electronics'                   => 'electronics',
    'Vehicles (2wheeler/4wheeler)'  => 'vehicles-2wheeler-4wheeler',
    'Groceries'                     => 'groceries',
];

// Legacy product-category label  →  canonical category.
$map = [
    'coin'        => 'Gold',
    'gold asset'  => 'Gold',
    'gold bar'    => 'Gold',
    'gold bars'   => 'Gold',
    'gold coin'   => 'Gold',
    'gold coins'  => 'Gold',
    'jewellery'   => 'Gold',
    'jewelry'     => 'Gold',
    'silver'      => 'Gold',
    'mobile'      => 'Electronics',
    'mobiles'     => 'Electronics',
    'laptop'      => 'Electronics',
    'laptops'     => 'Electronics',
    'camera'      => 'Electronics',
    'accessories' => 'Electronics',
    'electronic'  => 'Electronics',
    'vehicle'     => 'Vehicles (2wheeler/4wheeler)',
    'vehicles'    => 'Vehicles (2wheeler/4wheeler)',
    'grocery'     => 'Groceries',
    'construction'=> 'House Construction',
];

// Snapshot before.
$before = $db->query("SELECT category, COUNT(*) c FROM products GROUP BY category ORDER BY category")
             ->fetchAll(PDO::FETCH_KEY_PAIR);

$canonNames = array_keys($canonical);
$update = $db->prepare("UPDATE products SET category = ? WHERE id = ?");

$remapped = []; $unmatched = [];
$rows = $db->query("SELECT id, category FROM products")->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    $cat = trim((string)$r['category']);
    if (in_array($cat, $canonNames, true)) continue;          // already canonical

    $key = strtolower($cat);
    $target = $map[$key] ?? null;

    // Fuzzy fallback: substring contains a known keyword.
    if (!$target) {
        if (preg_match('/gold|coin|jewel|silver|bar/i', $cat))            $target = 'Gold';
        elseif (preg_match('/mobile|laptop|camera|electronic|phone|tv/i', $cat)) $target = 'Electronics';
        elseif (preg_match('/vehicle|bike|car|scooter|wheeler/i', $cat))  $target = 'Vehicles (2wheeler/4wheeler)';
        elseif (preg_match('/grocer|food|rice|oil/i', $cat))             $target = 'Groceries';
        elseif (preg_match('/cement|brick|sand|steel|concrete|construction house/i', $cat)) $target = 'House Construction';
        elseif (preg_match('/tile|putty|paint|pipe|plywood|material/i', $cat)) $target = 'All Construction Material';
    }

    if ($target) {
        $update->execute([$target, $r['id']]);
        $remapped[$cat] = ($remapped[$cat] ?? 0) + 1;
    } else {
        $unmatched[$cat] = ($unmatched[$cat] ?? 0) + 1;
    }
}

// Remove every category row that is not one of the six canonical ones.
$keepSlugs = array_values($canonical);
$placeholders = implode(',', array_fill(0, count($keepSlugs), '?'));
$del = $db->prepare("DELETE FROM categories WHERE slug NOT IN ($placeholders)");
$del->execute($keepSlugs);
$deletedCategories = $del->rowCount();

// Make sure the six exist (in case any were missing).
$ins = $db->prepare("INSERT IGNORE INTO categories (name, slug) VALUES (?, ?)");
foreach ($canonical as $name => $slug) { $ins->execute([$name, $slug]); }

// Snapshot after.
$after = $db->query("SELECT category, COUNT(*) products, COALESCE(SUM(stock_quantity),0) units
                     FROM products GROUP BY category ORDER BY category")
            ->fetchAll(PDO::FETCH_ASSOC);
$catsLeft = $db->query("SELECT name FROM categories ORDER BY name")->fetchAll(PDO::FETCH_COLUMN);

echo json_encode([
    'status'             => 'success',
    'message'            => 'Categories normalized to the six canonical groups.',
    'before'             => $before,
    'remapped_products'  => $remapped,
    'unmatched'          => (object)$unmatched,   // any product we left untouched (none expected)
    'deleted_categories' => $deletedCategories,
    'categories_now'     => $catsLeft,
    'catalog_now'        => $after,
], JSON_PRETTY_PRINT);
