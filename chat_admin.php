<?php
$host = "localhost";
$user = "root";   // ggf. anpassen
$pass = "";       // ggf. anpassen
$db   = "allrounder"; // unsere DB

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    die("Verbindung fehlgeschlagen: " . $conn->connect_error);
}

// Nachricht löschen
if (isset($_GET['delete'])) {
    $id = intval($_GET['delete']);
    $conn->query("DELETE FROM messages WHERE id = $id");
    header("Location: chat_admin.php");
    exit;
}

// Alle Nachrichten löschen (setzt IDs zurück)
if (isset($_GET['truncate'])) {
    $conn->query("TRUNCATE TABLE messages");
    header("Location: chat_admin.php");
    exit;
}

// Nachrichten abrufen
$result = $conn->query("SELECT * FROM messages ORDER BY id DESC LIMIT 100");

// === Entschlüsselung in PHP mit OpenSSL ===
function decryptMessage($encrypted, $secretKey) {
    // CryptoJS AES (mit passphrase) benutzt OpenSSL-kompatible Methode
    $ciphertext_dec = base64_decode($encrypted);

    // prüfen ob "Salted__" Header drin ist
    if (substr($ciphertext_dec, 0, 8) !== "Salted__") {
        return $encrypted; // vermutlich Klartext oder defekt
    }

    $salt = substr($ciphertext_dec, 8, 8);
    $ct = substr($ciphertext_dec, 16);

    $rounds = 3; // Standard bei CryptoJS
    $data00 = $secretKey . $salt;
    $hash = [];
    $hash[0] = md5($data00, true);
    $result = $hash[0];
    for ($i = 1; $i < $rounds; $i++) {
        $hash[$i] = md5($hash[$i-1] . $data00, true);
        $result .= $hash[$i];
    }
    $key = substr($result, 0, 32);
    $iv  = substr($result, 32, 16);

    $decrypted = openssl_decrypt($ct, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv);
    return $decrypted ?: "[Fehler beim Entschlüsseln]";
}

// Dein Schlüssel muss mit dem in index.html identisch sein
$SECRET_KEY = "meinSuperKey123";
?>
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>Chat Admin</title>
<style>
body { font-family: Arial, sans-serif; background:#111; color:#eee; padding:20px; }
table { border-collapse: collapse; width: 100%; background:#222; }
th, td { border: 1px solid #444; padding: 8px; text-align: left; }
th { background:#333; }
a { color: #ff4444; text-decoration: none; }
a:hover { text-decoration: underline; }
button { margin-top: 10px; padding: 8px 12px; background:#900; color:#fff; border:none; border-radius:5px; cursor:pointer; }
button:hover { background:#c00; }
</style>
</head>
<body>
<h2>Chat Admin</h2>

<table>
  <tr>
    <th>ID</th>
    <th>User</th>
    <th>Nachricht (Klartext)</th>
    <th>Zeit</th>
    <th>Aktion</th>
  </tr>
  <?php while ($row = $result->fetch_assoc()): ?>
  <tr>
    <td><?= htmlspecialchars($row['id']) ?></td>
    <td><?= htmlspecialchars($row['username']) ?></td>
    <td><?= htmlspecialchars(decryptMessage($row['message'], $SECRET_KEY)) ?></td>
    <td><?= htmlspecialchars($row['created_at']) ?></td>
    <td><a href="?delete=<?= $row['id'] ?>" onclick="return confirm('Wirklich löschen?')">❌ Löschen</a></td>
  </tr>
  <?php endwhile; ?>
</table>

<form method="get" action="">
  <button type="submit" name="truncate" value="1" onclick="return confirm('Wirklich alle Nachrichten löschen?')">⚠️ Alle löschen</button>
</form>

</body>
</html>
<?php $conn->close(); ?>
