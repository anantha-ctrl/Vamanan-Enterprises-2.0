<?php
$file = '../../mysql/data/makkal_gold/users.ibd';
if (file_exists($file)) {
    echo "FILE_EXISTS: " . realpath($file);
} else {
    echo "FILE_NOT_FOUND: " . $file . " | SEARCHED_AT: " . realpath('.') . ' | TRIED: ' . $file;
}
?>
