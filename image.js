
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Méthode non autorisée."
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "La clé Gemini manque dans Vercel."
    });
  }

  try {
    const prompt = String(req.body?.prompt || "").trim();

    if (!prompt) {
      return res.status(400).json({
        error: "Décris l'image que tu veux créer."
      });
    }

    if (prompt.length > 2000) {
      return res.status(400).json({
        error: "La description est trop longue (maximum 2000 caractères)."
      });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          model: "gemini-3.1-flash-image",
          input: prompt,
          response_format: {
            type: "image",
            mime_type: "image/png",
            aspect_ratio: "1:1",
            image_size: "1K"
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Erreur Gemini Image :", data);
      return res.status(response.status).json({
        error: data.error?.message ||
          "Le service de génération d'images a échoué."
      });
    }

    const generated = data.output_image;

    if (!generated?.data) {
      return res.status(502).json({
        error: "Aucune image reçue de Gemini."
      });
    }

    return res.status(200).json({
      image: generated.data,
      mimeType: generated.mime_type || "image/png",
      text: data.output_text || ""
    });

  } catch (error) {
    console.error("Erreur Xeben Image :", error);
    return res.status(500).json({
      error: "Erreur interne lors de la création de l'image."
    });
  }
      }
