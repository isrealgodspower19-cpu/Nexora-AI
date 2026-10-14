const json = (statusCode, payload) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("AI service is not configured.");
    }

    const body = JSON.parse(event.body || "{}");
    const message = body.message;

    if (typeof message !== "string" || !message.trim()) {
      return json(400, { error: "Please enter a message." });
    }

    if (message.length > 10000) {
      return json(400, { error: "Your message is too long." });
    }

    // Check Google's docs for the current model name if this one stops working.
    const model = "gemini-2.5-flash";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message.trim() }] }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", JSON.stringify(data));
      return json(502, {
        error: "The AI service could not respond. Please try again."
      });
    }

    const answer = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    if (!answer) {
      return json(502, { error: "The AI returned an empty response." });
    }

    return json(200, { answer });
  } catch (error) {
    console.error("NEXORA function error:", error);
    return json(500, { error: "Something went wrong. Please try again." });
  }
};
