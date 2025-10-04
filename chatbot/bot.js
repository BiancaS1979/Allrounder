// Erinnerungen laden
function loadMemory() {
  let memory = JSON.parse(localStorage.getItem("missyMemory")) || [];
  // nur Einträge behalten, die jünger als 20 Tage sind
  const cutoff = Date.now() - (20 * 24 * 60 * 60 * 1000);
  memory = memory.filter(entry => entry.date > cutoff);
  localStorage.setItem("missyMemory", JSON.stringify(memory));
  return memory;
}

function saveMemory(memory) {
  localStorage.setItem("missyMemory", JSON.stringify(memory));
}

function sendMessage() {
  const input = document.getElementById("userInput");
  const message = input.value.trim();
  if (!message) return;

  addMessage("Du", message);

  const reply = getBotReply(message);
  addMessage("Missy", reply);

  input.value = "";
}

function addMessage(sender, text) {
  const chat = document.getElementById("chatArea");
  const div = document.createElement("p");
  div.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function getBotReply(msg) {
  let memory = loadMemory();
  const lower = msg.toLowerCase();

  // --- Erinnerungen speichern ---
  if (lower.startsWith("merk dir")) {
    const info = msg.substring(8).trim();
    if (info) {
      memory.push({ text: info, date: Date.now() });
      saveMemory(memory);
      return `Alles klar, ich hab mir gemerkt: "${info}" ✅`;
    } else {
      return "Sag mir, was ich mir merken soll 😊";
    }
  }

  // --- Erinnerungen abrufen ---
  if (lower.startsWith("erinnere dich")) {
    if (memory.length === 0) {
      return "Ich habe mir bisher nichts gemerkt 🤔";
    }
    const list = memory.map(m => "• " + m.text).join("<br>");
    return "Das habe ich mir gemerkt:<br>" + list;
  }

  // Begrüßungen
  if (lower.includes("hallo") || lower.includes("hi") || lower.includes("hey")) {
    return "Hallo 😊 Schön dich zu sehen!";
  }

  // Wie geht's
  if (lower.includes("wie geht")) {
    return "Mir geht's super, danke der Nachfrage! Und dir?";
  }

  // Uhrzeit
  if (lower.includes("zeit") || lower.includes("uhr")) {
    const now = new Date();
    return "Es ist gerade " + now.getHours() + ":" + now.getMinutes().toString().padStart(2, "0") + " Uhr.";
  }

  // Datum
  if (lower.includes("datum") || lower.includes("tag")) {
    const now = new Date();
    return "Heute ist " + now.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }

  // Witz
  if (lower.includes("witz")) {
    const jokes = [
      "Warum können Skelette so schlecht lügen? Weil man direkt durch sie hindurchsieht! 💀😂",
      "Warum können Seeräuber den Kreis nicht berechnen? Weil sie Pi raten müssen! 🏴‍☠️",
      "Was macht ein Pirat am Computer? Er drückt die Enter-Taste! ⌨️",
      "Warum ging der Pilz auf die Party? Weil er ein Champignon war! 🍄"
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }

  // Hilfe
  if (lower.includes("hilfe") || lower.includes("was kannst du")) {
    return "Ich kann dir Witze erzählen, die Uhrzeit oder das Datum nennen, mich an Dinge erinnern (mit 'merk dir') und sie dir wiedergeben (mit 'erinnere dich').";
  }

  // Standardantwort
  return "Das habe ich noch nicht verstanden 🤔 Aber du kannst mir Dinge mit 'merk dir ...' beibringen!";
}
