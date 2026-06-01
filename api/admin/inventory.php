<?php
// api/admin/inventory.php — Real-Time Stock Inventory Management API
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require_once '../config.php';
$db = $pdo;

// ── Self-Healing Schema ──────────────────────────────────────────────────────
try { $db->exec("ALTER TABLE products ADD COLUMN stock_quantity INT NOT NULL DEFAULT 0"); } catch (Exception $e) {}
try { $db->exec("ALTER TABLE products ADD COLUMN low_stock_threshold INT NOT NULL DEFAULT 10"); } catch (Exception $e) {}
try { $db->exec("ALTER TABLE products ADD COLUMN stock_notes TEXT DEFAULT NULL"); } catch (Exception $e) {}

$db->exec("CREATE TABLE IF NOT EXISTS stock_movements (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    product_id   INT NOT NULL,
    movement_type ENUM('add','remove','adjust','sale','return','initial') DEFAULT 'adjust',
    quantity     INT NOT NULL DEFAULT 0,
    previous_qty INT NOT NULL DEFAULT 0,
    new_qty      INT NOT NULL DEFAULT 0,
    notes        TEXT,
    created_by   INT DEFAULT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
)");

$db->exec("CREATE TABLE IF NOT EXISTS inventory_alerts (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    product_id   INT NOT NULL,
    alert_type   ENUM('low_stock','out_of_stock','overstock') DEFAULT 'low_stock',
    current_qty  INT DEFAULT 0,
    threshold    INT DEFAULT 10,
    is_resolved  TINYINT(1) DEFAULT 0,
    resolved_at  TIMESTAMP NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
)");
// ────────────────────────────────────────────────────────────────────────────

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ── Helper: auto-generate alerts ─────────────────────────────────────────────
function syncAlerts($db, $product_id, $new_qty, $threshold) {
    // Resolve old unresolved alerts for this product
    $db->prepare("UPDATE inventory_alerts SET is_resolved = 1, resolved_at = NOW() WHERE product_id = ? AND is_resolved = 0")->execute([$product_id]);

    if ($new_qty === 0) {
        $db->prepare("INSERT INTO inventory_alerts (product_id, alert_type, current_qty, threshold) VALUES (?, 'out_of_stock', ?, ?)")
            ->execute([$product_id, $new_qty, $threshold]);
    } elseif ($new_qty <= $threshold) {
        $db->prepare("INSERT INTO inventory_alerts (product_id, alert_type, current_qty, threshold) VALUES (?, 'low_stock', ?, ?)")
            ->execute([$product_id, $new_qty, $threshold]);
    }
}

// ════════════════════════════════════════════════════════════════════════════
// GET
// ════════════════════════════════════════════════════════════════════════════
if ($method === 'GET') {

    if ($action === 'movements') {
        // Stock movement history (all or per-product)
        $limit      = min((int)($_GET['limit'] ?? 100), 500);
        $product_id = isset($_GET['product_id']) ? (int)$_GET['product_id'] : null;

        if ($product_id) {
            $stmt = $db->prepare(
                "SELECT sm.*, p.name AS product_name, p.category, p.image
                 FROM stock_movements sm
                 JOIN products p ON sm.product_id = p.id
                 WHERE sm.product_id = ?
                 ORDER BY sm.created_at DESC LIMIT ?"
            );
            $stmt->execute([$product_id, $limit]);
        } else {
            $stmt = $db->prepare(
                "SELECT sm.*, p.name AS product_name, p.category, p.image
                 FROM stock_movements sm
                 JOIN products p ON sm.product_id = p.id
                 ORDER BY sm.created_at DESC LIMIT ?"
            );
            $stmt->execute([$limit]);
        }
        $movements = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['status' => 'success', 'data' => $movements, 'count' => count($movements)]);
        exit;
    }

    if ($action === 'alerts') {
        // Active unresolved alerts
        $stmt = $db->query(
            "SELECT ia.*, p.name AS product_name, p.category, p.image, p.price
             FROM inventory_alerts ia
             JOIN products p ON ia.product_id = p.id
             WHERE ia.is_resolved = 0
             ORDER BY ia.created_at DESC"
        );
        $alerts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['status' => 'success', 'data' => $alerts, 'count' => count($alerts)]);
        exit;
    }

    // Default: Full inventory list with summary
    $search   = $_GET['search']   ?? '';
    $category = $_GET['category'] ?? '';
    $stockFilter = $_GET['stock_filter'] ?? 'all'; // all|in_stock|low_stock|out_of_stock

    $where  = ['1=1'];
    $params = [];
    if ($search) {
        $where[]  = "(p.name LIKE ? OR p.category LIKE ? OR p.slug LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }
    if ($category) {
        $where[]  = "p.category = ?";
        $params[] = $category;
    }

    $having = '';
    if ($stockFilter === 'out_of_stock') $having = 'HAVING stock_status = "out_of_stock"';
    elseif ($stockFilter === 'low_stock')  $having = 'HAVING stock_status = "low_stock"';
    elseif ($stockFilter === 'in_stock')   $having = 'HAVING stock_status = "in_stock"';

    $whereStr = implode(' AND ', $where);

    $stmt = $db->prepare(
        "SELECT p.*,
            COALESCE((SELECT SUM(quantity) FROM stock_movements WHERE product_id = p.id AND movement_type IN ('add','initial')), 0)  AS total_added,
            COALESCE((SELECT SUM(quantity) FROM stock_movements WHERE product_id = p.id AND movement_type = 'sale'), 0)              AS total_sold,
            COALESCE((SELECT SUM(quantity) FROM stock_movements WHERE product_id = p.id AND movement_type = 'remove'), 0)           AS total_removed,
            COALESCE((SELECT COUNT(*) FROM inventory_alerts WHERE product_id = p.id AND is_resolved = 0), 0)                       AS active_alerts,
            COALESCE((SELECT created_at FROM stock_movements WHERE product_id = p.id ORDER BY created_at DESC LIMIT 1), NULL)       AS last_movement_at,
            (p.stock_quantity * p.price)                                                                                            AS stock_value,
            CASE
                WHEN p.stock_quantity = 0                          THEN 'out_of_stock'
                WHEN p.stock_quantity <= p.low_stock_threshold     THEN 'low_stock'
                ELSE 'in_stock'
            END AS stock_status
         FROM products p
         WHERE $whereStr
         $having
         ORDER BY p.name"
    );
    $stmt->execute($params);
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Summary stats
    $all = $db->query(
        "SELECT
            COUNT(*)                                                                AS total_products,
            SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END)                   AS out_of_stock,
            SUM(CASE WHEN stock_quantity > 0 AND stock_quantity <= low_stock_threshold THEN 1 ELSE 0 END) AS low_stock,
            SUM(CASE WHEN stock_quantity > low_stock_threshold THEN 1 ELSE 0 END) AS in_stock,
            SUM(stock_quantity * price)                                            AS total_stock_value,
            SUM(stock_quantity)                                                    AS total_units
         FROM products"
    )->fetch(PDO::FETCH_ASSOC);

    $active_alerts = (int)$db->query("SELECT COUNT(*) FROM inventory_alerts WHERE is_resolved = 0")->fetchColumn();

    // Distinct categories
    $cats = $db->query("SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category")->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode([
        'status'     => 'success',
        'data'       => $products,
        'summary'    => [
            'total_products'    => (int)($all['total_products'] ?? 0),
            'in_stock'          => (int)($all['in_stock']       ?? 0),
            'low_stock'         => (int)($all['low_stock']      ?? 0),
            'out_of_stock'      => (int)($all['out_of_stock']   ?? 0),
            'total_stock_value' => (float)($all['total_stock_value'] ?? 0),
            'total_units'       => (int)($all['total_units']    ?? 0),
            'active_alerts'     => $active_alerts,
        ],
        'categories' => $cats,
        'count'      => count($products),
    ]);
    exit;
}

// ════════════════════════════════════════════════════════════════════════════
// POST — Stock Update
// ════════════════════════════════════════════════════════════════════════════
if ($method === 'POST') {
    $data       = json_decode(file_get_contents('php://input'), true) ?? [];
    $action     = $data['action']     ?? 'add';
    $product_id = (int)($data['product_id'] ?? 0);
    $notes      = trim($data['notes'] ?? '');
    $created_by = (int)($data['created_by'] ?? 0) ?: null;

    if (!$product_id) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'product_id is required.']);
        exit;
    }

    // Load current product
    $stmt = $db->prepare("SELECT id, name, stock_quantity, low_stock_threshold FROM products WHERE id = ?");
    $stmt->execute([$product_id]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$product) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Product not found.']);
        exit;
    }

    $current_qty = (int)$product['stock_quantity'];
    $threshold   = (int)$product['low_stock_threshold'];
    $quantity    = (int)($data['quantity'] ?? 0);

    // Threshold-only update
    if ($action === 'threshold') {
        $new_threshold = max(0, (int)($data['threshold'] ?? 10));
        $db->prepare("UPDATE products SET low_stock_threshold = ? WHERE id = ?")->execute([$new_threshold, $product_id]);
        syncAlerts($db, $product_id, $current_qty, $new_threshold);
        echo json_encode(['status' => 'success', 'message' => 'Low-stock threshold updated.', 'threshold' => $new_threshold]);
        exit;
    }

    // Resolve alert only
    if ($action === 'resolve_alert') {
        $db->prepare("UPDATE inventory_alerts SET is_resolved = 1, resolved_at = NOW() WHERE product_id = ? AND is_resolved = 0")->execute([$product_id]);
        echo json_encode(['status' => 'success', 'message' => 'Alert resolved.']);
        exit;
    }

    if ($quantity <= 0 && $action !== 'set') {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Quantity must be greater than zero.']);
        exit;
    }

    // Compute new quantity
    switch ($action) {
        case 'add':
            $new_qty       = $current_qty + $quantity;
            $movement_type = 'add';
            $label         = "Added";
            break;
        case 'remove':
            $new_qty       = max(0, $current_qty - $quantity);
            $movement_type = 'remove';
            $label         = "Removed";
            break;
        case 'set':
            $new_qty       = max(0, $quantity);
            $movement_type = 'adjust';
            $label         = "Set";
            break;
        case 'sale':
            $new_qty       = max(0, $current_qty - $quantity);
            $movement_type = 'sale';
            $label         = "Sold";
            break;
        case 'return':
            $new_qty       = $current_qty + $quantity;
            $movement_type = 'return';
            $label         = "Returned";
            break;
        default:
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => "Unknown action '$action'."]);
            exit;
    }

    try {
        $db->beginTransaction();

        // Update product stock
        $db->prepare("UPDATE products SET stock_quantity = ? WHERE id = ?")->execute([$new_qty, $product_id]);

        // Log movement
        $db->prepare(
            "INSERT INTO stock_movements (product_id, movement_type, quantity, previous_qty, new_qty, notes, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        )->execute([$product_id, $movement_type, abs($quantity), $current_qty, $new_qty, $notes ?: null, $created_by]);

        // Sync alerts
        syncAlerts($db, $product_id, $new_qty, $threshold);

        $db->commit();

        $stock_status = $new_qty === 0 ? 'out_of_stock' : ($new_qty <= $threshold ? 'low_stock' : 'in_stock');

        echo json_encode([
            'status'        => 'success',
            'message'       => "$label {$quantity} unit(s). New stock: {$new_qty}.",
            'product_id'    => $product_id,
            'product_name'  => $product['name'],
            'previous_qty'  => $current_qty,
            'new_qty'       => $new_qty,
            'stock_status'  => $stock_status,
            'movement_type' => $movement_type,
        ]);

    } catch (Exception $e) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'DB error: ' . $e->getMessage()]);
    }
    exit;
}

// ════════════════════════════════════════════════════════════════════════════
// DELETE — Remove product from inventory (soft delete via is_active = 0)
// ════════════════════════════════════════════════════════════════════════════
if ($method === 'DELETE') {
    $data       = json_decode(file_get_contents('php://input'), true) ?? [];
    $product_id = (int)($data['product_id'] ?? 0);
    if (!$product_id) { echo json_encode(['status' => 'error', 'message' => 'product_id required']); exit; }
    $db->prepare("UPDATE products SET is_active = 0, stock_quantity = 0 WHERE id = ?")->execute([$product_id]);
    echo json_encode(['status' => 'success', 'message' => 'Product removed from inventory.']);
    exit;
}

http_response_code(405);
echo json_encode(['status' => 'error', 'message' => 'Method not allowed.']);
