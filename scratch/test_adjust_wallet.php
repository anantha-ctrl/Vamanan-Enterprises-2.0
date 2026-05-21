<?php
// test_adjust_wallet.php
$url = 'http://localhost/Makkal_Gold/api/admin/adjust_wallet.php';
$data = array(
    'user_id' => 1,
    'amount' => 10,
    'type' => 'credit',
    'reason' => 'Test credit'
);

$options = array(
    'http' => array(
        'header'  => "Content-type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($data)
    )
);

$context  = stream_context_create($options);
$result = file_get_contents($url, false, $context);

if ($result === FALSE) {
    echo "Error calling API";
} else {
    echo $result;
}
?>
