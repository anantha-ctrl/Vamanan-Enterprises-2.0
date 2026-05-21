<?php
// api/models/Wallet.php
class Wallet {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getBalance($userId) {
        $query = "SELECT id, balance FROM wallets WHERE user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->execute(['user_id' => $userId]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // If wallet doesn't exist, create one
        if (!$data) {
            $this->conn->prepare("INSERT INTO wallets (user_id, balance) VALUES (?, 0.00)")->execute([$userId]);
            return ['id' => $this->conn->lastInsertId(), 'balance' => 0.00];
        }
        return $data;
    }

    public function credit($userId, $amount, $category, $description) {
        return $this->addTransaction($userId, 'credit', $category, $amount, $description);
    }

    public function debit($userId, $amount, $category, $description) {
        return $this->addTransaction($userId, 'debit', $category, $amount, $description);
    }

    public function addTransaction($userId, $type, $category, $amount, $description) {
        try {
            $inTransaction = $this->conn->inTransaction();
            if (!$inTransaction) $this->conn->beginTransaction();

            // Ensure wallet exists
            $wallet = $this->getBalance($userId);
            $walletId = $wallet['id'];

            // Update Balance and tracking columns
            $op = ($type == 'credit') ? "+" : "-";
            $extraUpdate = "";
            if ($type == 'credit') {
                $extraUpdate = ", total_earned = total_earned + :amount";
            } elseif ($type == 'debit' && ($category == 'withdrawal' || $category == 'liquidation')) {
                $extraUpdate = ", total_withdrawn = total_withdrawn + :amount";
            }

            $query = "UPDATE wallets SET balance = balance $op :amount $extraUpdate WHERE id = :wallet_id";
            $stmt = $this->conn->prepare($query);
            $stmt->execute(['amount' => $amount, 'wallet_id' => $walletId]);

            // Record Transaction
            $logQuery = "INSERT INTO transactions (wallet_id, type, category, amount, description, status) 
                         VALUES (:wallet_id, :type, :category, :amount, :description, 'completed')";
            $stmt = $this->conn->prepare($logQuery);
            $stmt->execute([
                'wallet_id' => $walletId,
                'type' => $type,
                'category' => $category,
                'amount' => $amount,
                'description' => $description
            ]);

            if (!$inTransaction) $this->conn->commit();
            return true;
        } catch (Exception $e) {
            if (!$inTransaction && $this->conn->inTransaction()) $this->conn->rollBack();
            return false;
        }
    }

    public function getTransactions($userId) {
        $query = "SELECT t.* FROM transactions t 
                  JOIN wallets w ON t.wallet_id = w.id 
                  WHERE w.user_id = :user_id 
                  ORDER BY t.created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute(['user_id' => $userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
