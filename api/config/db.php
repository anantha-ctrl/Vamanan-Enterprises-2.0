<?php
// api/config/db.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit;
}

class Database {
    // private $host = "localhost";
    // private $db_name = "cwhycofr_makkal_gold";
    // private $username = "cwhycofr_admin";
    // private $password = "vamanan@gold123";

    private $host = "localhost";
    private $db_name = "makkal_gold";
    private $username = "root";
    private $password = "anantha";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            // First connect without DB to ensure it exists
            $temp_pdo = new PDO("mysql:host=" . $this->host, $this->username, $this->password);
            $temp_pdo->exec("CREATE DATABASE IF NOT EXISTS " . $this->db_name);
            
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            // On connection error, return null so caller can handle it
            return null;
        }
        return $this->conn;
    }
}
?>
