<?php
$host = "localhost";
$user = "root";   // ggf. anpassen
$pass = "";       // ggf. anpassen
$db   = "allrounder"; // unsere neue DB

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Verbindung fehlgeschlagen: " . $conn->connect_error);
}

$username = $_POST['username'] ?? "Anonym";
$message  = $_POST['message'] ?? "";

if (!empty($message)) {
    $stmt = $conn->prepare("INSERT INTO messages (username, message) VALUES (?, ?)");
    $stmt->bind_param("ss", $username, $message);
    $stmt->execute();
    $stmt->close();
}

$conn->close();
?>

