
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Méthode non autorisée."
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "La variable GEMINI_API_KEY manque dans Vercel."
    });
  }

  try {
    const body = req.body || {};
    const message = String(body.message || body.prompt || "").trim();

    const previousMessages = Array.isArray(body.messages)
      ? body.messages
          .filter(m =>
            m &&
            ["user", "assistant", "model"].includes(m.role) &&
            typeof m.content === "string"
          )
          .slice(-20)
      : [];

    const history = previousMessages.map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }]
    }));

    if (message) {
      history.push({
        role: "user",
        parts: [{ text: message }]
      });
    }

    if (history.length === 0) {
      return res.status(400).json({
        error: "Écris un message pour Xeben."
      });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{
              text: "Tu es Xeben, un assistant IA francophone, amical, intelligent et professionnel. Réponds clairement en français."
            }]
          },
          contents: history,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Erreur Gemini :", data);
      return res.status(response.status).json({
        error: data.error?.message || "Erreur du service Gemini."
      });
    }

    const reply = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    if (!reply) {
      return res.status(502).json({
        error: "Gemini n'a pas renvoyé de texte. Réessaie."
      });
    }

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Erreur Xeben :", error);
    return res.status(500).json({
      error: "Erreur interne du serveur Xeben."
    });
  }
}
