<?php
$host = "localhost";
$user = "root";   // ggf. anpassen
$pass = "";       // ggf. anpassen
$db   = "allrounder"; // unsere neue DB

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Verbindung fehlgeschlagen: " . $conn->connect_error);
}

$result = $conn->query("SELECT username, message, created_at FROM messages ORDER BY id DESC LIMIT 50");

$messages = [];
while ($row = $result->fetch_assoc()) {
    $messages[] = $row;
}

echo json_encode(array_reverse($messages));

$conn->close();
?>
