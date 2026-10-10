
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: "Méthode non autorisée. Utilise POST."
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "La clé API OpenAI manque dans Vercel."
    });
  }

  try {
    const body = req.body || {};
    const messages = Array.isArray(body.messages)
      ? body.messages
      : [];

    const lastMessage =
      body.message ||
      body.prompt ||
      [...messages].reverse().find(
        (m) => m && m.role === "user"
      )?.content;

    if (!lastMessage) {
      return res.status(400).json({
        error: "Écris un message pour Xeben."
      });
    }

    const input = [
      {
        role: "system",
        content:
          "Tu es Xeben, un assistant IA nouvelle génération, expert, chaleureux, naturel et futuriste. Réponds en français sauf si l'utilisateur écrit dans une autre langue. Sois précis, utile et amical. N'affirme jamais être humain."
      },
      ...messages
        .filter(
          (m) =>
            m &&
            ["user", "assistant"].includes(m.role) &&
            typeof m.content === "string"
        )
        .slice(-20)
        .map((m) => ({
          role: m.role,
          content: m.content
        })),
    ];

    if (messages.length === 0) {
      input.push({
        role: "user",
        content: String(lastMessage)
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          input,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error:", data);
      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Le service IA n'a pas pu répondre."
      });
    }

    const reply =
      data.output
        ?.flatMap((item) => item.content || [])
        .filter((item) => item.type === "output_text")
        .map((item) => item.text)
        .join("\n") || "";

    return res.status(200).json({
      reply,
      output_text: reply
    });
  } catch (error) {
    console.error("Erreur API Xeben:", error);
    return res.status(500).json({
      error: "Une erreur est survenue pendant la réponse de Xeben."
    });
  }
}
