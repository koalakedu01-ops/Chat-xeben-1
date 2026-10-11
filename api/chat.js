export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Méthode non autorisée."
    });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "La clé GROQ_API_KEY manque dans Vercel."
    });
  }

  try {
    const body = req.body || {};
    const message = body.message || body.prompt;

    const previousMessages = Array.isArray(body.messages)
      ? body.messages.filter(
          m => m &&
            ["user", "assistant"].includes(m.role) &&
            typeof m.content === "string"
        ).slice(-20)
      : [];

    if (!message && previousMessages.length === 0) {
      return res.status(400).json({
        error: "Écris un message pour Xeben."
      });
    }

    const messages = [
      {
        role: "system",
        content: "Tu es Xeben, un assistant IA francophone, amical, intelligent et professionnel. Réponds clairement en français."
      },
      ...previousMessages
    ];

    if (message && previousMessages.length === 0) {
      messages.push({
        role: "user",
        content: String(message)
      });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Erreur du service Groq."
      });
    }

    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(502).json({
        error: "Groq n'a pas renvoyé de réponse."
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
