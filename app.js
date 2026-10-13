
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

function addImage(base64, mimeType = "image/png") {
  const wrapper = document.createElement("div");
  wrapper.className = "msg assistant";

  const image = document.createElement("img");
  image.src = `data:${mimeType};base64,${base64}`;
  image.alt = "Image générée par Xeben";
  image.style.display = "block";
  image.style.width = "100%";
  image.style.maxWidth = "420px";
  image.style.height = "auto";
  image.style.borderRadius = "12px";

  wrapper.appendChild(image);
  chat.appendChild(wrapper);
  chat.scrollTop = chat.scrollHeight;
}

addMessage("Salut 👋 Je suis Xeben, ton assistant IA.");

async function send() {
  const message = input.value.trim();
  if (!message) return;

  input.value = "";
  addMessage(message, "user");

  const waiting = addMessage("Xeben réfléchit…", "assistant");

  try {
    const wantsImage =
      /\b(génère|générer|crée|créer|dessine|dessiner|fabrique|imagine)\b.*\b(image|photo|illustration|dessin|logo|fond d'écran|portrait)\b/i.test(message) ||
      /\b(image|photo|illustration)\b.*\b(génère|crée|dessine)\b/i.test(message);

    const endpoint = wantsImage ? "/api/image" : "/api/chat";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(
        wantsImage ? { prompt: message } : { message }
      )
    });

    const raw = await response.text();
    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error("Réponse serveur illisible. Vérifie les logs Vercel.");
    }

    if (!response.ok) {
      throw new Error(data.error || "Erreur du serveur.");
    }

    if (wantsImage) {
      if (!data.image) {
        throw new Error("Le serveur n'a renvoyé aucune image.");
      }

      waiting.remove();
      addMessage("Voici ton image ! 🎨", "assistant");
      addImage(data.image, data.mimeType);
    } else {
      const reply = data.reply || data.output_text;

      if (!reply) {
        throw new Error("La réponse de Xeben est vide.");
      }

      waiting.textContent = reply;
    }
  } catch (error) {
    waiting.textContent = "Impossible de répondre : " + error.message;
  }

  chat.scrollTop = chat.scrollHeight;
}

window.send = send;

input.addEventListener("keydown", event => {
  if (event.key === "Enter") send();
});
