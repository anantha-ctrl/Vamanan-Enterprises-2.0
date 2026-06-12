<?php
// api/admin/seed_catalog.php
// Seeds real, database-backed products into the six core categories so every
// category has live inventory (visible in Admin Inventory, the customer Shop,
// and the Tally Inventory Ledger). Safe to run repeatedly — it never duplicates:
// a product is inserted only if the same name+category does not already exist.
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require_once '../config.php';
$db = $pdo;

// Make sure the inventory columns exist (added normally by inventory.php).
foreach ([
    "ALTER TABLE products ADD COLUMN stock_quantity INT NOT NULL DEFAULT 0",
    "ALTER TABLE products ADD COLUMN low_stock_threshold INT NOT NULL DEFAULT 10",
] as $sql) { try { $db->exec($sql); } catch (Exception $e) {} }

// Guarantee the six canonical categories exist.
$categories = [
    ['Gold', 'gold'],
    ['House Construction', 'house-construction'],
    ['All Construction Material', 'all-construction-material'],
    ['Electronics', 'electronics'],
    ['Vehicles (2wheeler/4wheeler)', 'vehicles-2wheeler-4wheeler'],
    ['Groceries', 'groceries'],
];
$catStmt = $db->prepare("INSERT IGNORE INTO categories (name, slug) VALUES (?, ?)");
foreach ($categories as $c) { $catStmt->execute($c); }

// Catalog: [name, category, price, weight, purity, stock, description]
// weight/purity only meaningful for Gold; general goods keep weight 0, purity ''.
$catalog = [
    // ── Gold ──────────────────────────────────────────────
    ['24K Gold Coin (1g)',        'Gold', 7850,    1.0,  '24K', 150, 'BIS Hallmarked 24K pure gold coin.'],
    ['22K Gold Coin (2g)',        'Gold', 15700,   2.0,  '22K', 120, 'BIS Hallmarked 22K gold coin.'],
    ['24K Gold Bar (10g)',        'Gold', 78500,   10.0, '24K', 40,  '99.9% pure 24K gold bar with assay certificate.'],
    ['22K Gold Necklace (8g)',    'Gold', 64000,   8.0,  '22K', 25,  'Handcrafted 22K gold necklace.'],

    // ── House Construction ────────────────────────────────
    ['UltraTech Cement (50kg)',   'House Construction', 410,    0, '', 500, 'OPC 53 grade cement bag, 50kg.'],
    ['Red Clay Bricks (1000 nos)','House Construction', 8500,   0, '', 60,  'First-class red clay bricks, per 1000.'],
    ['M-Sand (1 Unit / 100 cft)', 'House Construction', 5200,   0, '', 80,  'Manufactured sand for plastering & concrete.'],
    ['TMT Steel Rod 12mm (1 ton)','House Construction', 62000,  0, '', 30,  'Fe-500D TMT reinforcement steel, per tonne.'],
    ['Ready Mix Concrete M20 (cum)','House Construction', 4800, 0, '', 50,  'M20 grade ready-mix concrete, per cubic metre.'],

    // ── All Construction Material ─────────────────────────
    ['Wall Putty (40kg)',         'All Construction Material', 950,   0, '', 200, 'White cement based wall putty, 40kg.'],
    ['Plywood Sheet (8x4 ft)',    'All Construction Material', 1850,  0, '', 120, 'BWP marine-grade plywood, 18mm.'],
    ['Vitrified Floor Tiles (Box)','All Construction Material', 720,  0, '', 300, 'Glazed vitrified tiles, 600x600mm, per box.'],
    ['PVC Pipe 4 inch (6m)',      'All Construction Material', 640,   0, '', 180, 'ISI-marked PVC drainage pipe, 6 metre.'],
    ['Asian Paints Emulsion (20L)','All Construction Material', 3200, 0, '', 90,  'Premium interior emulsion paint, 20 litre.'],

    // ── Electronics ───────────────────────────────────────
    ['Samsung Galaxy M14 5G',     'Electronics', 13990,  0, '', 75,  '6GB RAM, 128GB, 6000mAh smartphone.'],
    ['Redmi Smart TV 43" FHD',    'Electronics', 26999,  0, '', 40,  'Full HD Android smart LED television.'],
    ['Lenovo IdeaPad Slim 3',     'Electronics', 42990,  0, '', 35,  'Intel i5, 16GB RAM, 512GB SSD laptop.'],
    ['LG 260L Refrigerator',      'Electronics', 24990,  0, '', 28,  '3-star frost-free double-door fridge.'],
    ['boAt Rockerz 450 Headphone','Electronics', 1499,   0, '', 200, 'Bluetooth on-ear wireless headphones.'],

    // ── Vehicles (2wheeler/4wheeler) ──────────────────────
    ['Hero Splendor Plus',        'Vehicles (2wheeler/4wheeler)', 78000,  0, '', 20, '97cc commuter motorcycle, BS6.'],
    ['Honda Activa 6G',           'Vehicles (2wheeler/4wheeler)', 84000,  0, '', 25, '110cc automatic scooter, BS6.'],
    ['TVS Jupiter 110',           'Vehicles (2wheeler/4wheeler)', 79000,  0, '', 22, '110cc family scooter with disc brake.'],
    ['Maruti Suzuki Alto K10',    'Vehicles (2wheeler/4wheeler)', 425000, 0, '', 8,  '1.0L hatchback, AGS option, BS6.'],
    ['Tata Nexon XM',             'Vehicles (2wheeler/4wheeler)', 1015000,0, '', 6,  'Compact SUV, 5-star Global NCAP.'],

    // ── Groceries ─────────────────────────────────────────
    ['Ponni Boiled Rice (25kg)',  'Groceries', 1450, 0, '', 300, 'Premium Ponni boiled rice, 25kg bag.'],
    ['Sunflower Oil (5L)',        'Groceries', 720,  0, '', 250, 'Refined sunflower cooking oil, 5 litre.'],
    ['Toor Dal (5kg)',            'Groceries', 850,  0, '', 220, 'Unpolished toor (arhar) dal, 5kg.'],
    ['Sugar (10kg)',              'Groceries', 460,  0, '', 280, 'Refined white sugar, 10kg.'],
    ['Aashirvaad Atta (10kg)',    'Groceries', 540,  0, '', 240, 'Whole wheat flour, 10kg pack.'],
];

$exists = $db->prepare("SELECT id FROM products WHERE name = ? AND category = ? LIMIT 1");
$insert = $db->prepare(
    "INSERT INTO products (name, category, slug, weight, purity, price, description, is_active, stock_quantity, low_stock_threshold, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, 10, NOW(), NOW())"
);

$inserted = 0; $skipped = 0; $perCategory = [];
foreach ($catalog as $p) {
    [$name, $category, $price, $weight, $purity, $stock, $desc] = $p;
    $exists->execute([$name, $category]);
    if ($exists->fetch()) { $skipped++; continue; }

    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $name), '-')) . '-' . uniqid();
    $insert->execute([$name, $category, $slug, $weight, $purity, $price, $desc, $stock]);
    $inserted++;
    $perCategory[$category] = ($perCategory[$category] ?? 0) + 1;
}

// Live counts per category after seeding.
$counts = $db->query(
    "SELECT category, COUNT(*) AS products, COALESCE(SUM(stock_quantity),0) AS units,
            COALESCE(SUM(stock_quantity * price),0) AS stock_value
     FROM products WHERE is_active = 1 GROUP BY category ORDER BY category"
)->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    'status'       => 'success',
    'message'      => "Catalog seed complete. Inserted $inserted new product(s), skipped $skipped existing.",
    'inserted'     => $inserted,
    'skipped'      => $skipped,
    'by_category'  => $perCategory,
    'live_catalog' => $counts,
]);
