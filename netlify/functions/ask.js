exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({
        error: "Method not allowed"
      })
    };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("AI service is not configured.");
    }

    const body = JSON.parse(event.body || "{}");
    const message = body.message;

    if (
      typeof message !== "string" ||
      !message.trim()
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Please enter a message."
        })
      };
    }

    if (message.length > 10000) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Your message is too long."
        })
      };
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: message.trim()
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);

      return {
        statusCode: 502,
        body: JSON.stringify({
          error: "The AI service could not respond. Please try again."
        })
      };
    }

    const answer =
      data.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim();

    if (!answer) {
      return {
        statusCode: 502,
        body: JSON.stringify({
          error: "The AI returned an empty response."
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        answer
      })
    };
  } catch (error) {
    console.error("NEXORA function error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Something went wrong. Please try again."
      })
    };
  }
};
