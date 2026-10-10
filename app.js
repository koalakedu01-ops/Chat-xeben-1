
const chat = document.getElementById("chat");
const input = document.getElementById("text");

function addMessage(text, role = "") {
  const element = document.createElement("div");
  element.className = "msg " + role;
  element.textContent = text;
  chat.appendChild(element);
  chat.scrollTop = chat.scrollHeight;
  return element;
}

addMessage("Salut 👋 Je suis Xeben, ton assistant IA.");

async function send() {
  const message = input.value.trim();
  if (!message) return;

  input.value = "";
  addMessage(message, "user");

  const waiting = addMessage("Xeben réfléchit…", "assistant");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erreur du serveur IA.");
    }

    const reply = data.reply || data.output_text;

    if (!reply) {
      throw new Error("La réponse de l’IA est vide.");
    }

    waiting.textContent = reply;
  } catch (error) {
    waiting.textContent = "Impossible de répondre : " + error.message;
  }

  chat.scrollTop = chat.scrollHeight;
}

window.send = send;

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") send();
});
