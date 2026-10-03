import axios from "axios";

// Thrown when the upstream provider fails, so controllers can answer 502 instead of 500
export class AiServiceError extends Error {
  constructor(message, { status, upstreamStatus } = {}) {
    super(message);
    this.name = "AiServiceError";
    this.status = status || 502;
    this.upstreamStatus = upstreamStatus;
  }
}

export const askAi = async (messages) => {
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw new AiServiceError("No messages provided", { status: 500 });
  }

  let response;
  try {
    response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openrouter/free",
        messages: messages,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        // Without this a hung connection holds the Express request open forever
        timeout: 60000,
      },
    );
  } catch (error) {
    const upstreamStatus = error.response?.status;
    // Log the real cause server-side; keep the client message generic
    console.error("OpenRouter request failed:", upstreamStatus, error.message);

    if (error.code === "ECONNABORTED") {
      throw new AiServiceError("The AI service timed out. Please try again.", {
        status: 504,
        upstreamStatus,
      });
    }
    if (upstreamStatus === 401 || upstreamStatus === 403) {
      throw new AiServiceError("AI service is misconfigured.", {
        status: 502,
        upstreamStatus,
      });
    }
    if (upstreamStatus === 402) {
      throw new AiServiceError("AI service quota exhausted.", {
        status: 502,
        upstreamStatus,
      });
    }
    if (upstreamStatus === 429) {
      throw new AiServiceError("AI service is busy. Please try again shortly.", {
        status: 503,
        upstreamStatus,
      });
    }
    throw new AiServiceError("The AI service is unavailable right now.", {
      status: 502,
      upstreamStatus,
    });
  }

  // An error-shaped body has no choices array — don't blindly index [0]
  let content = response.data?.choices?.[0]?.message?.content;

  if (!content || !content.trim()) {
    throw new AiServiceError("The AI returned an empty response.");
  }

  // Strip markdown code fences (```json ... ``` or ``` ... ```) the model may wrap output in
  content = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return content;
};

// Models sometimes wrap JSON in prose. Pull out the outermost {...} and parse that.
export const parseAiJson = (raw) => {
  const attempt = (text) => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  let parsed = attempt(raw);

  if (!parsed) {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start !== -1 && end > start) {
      parsed = attempt(raw.slice(start, end + 1));
    }
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    console.error("Unparseable AI JSON:", raw?.slice(0, 300));
    throw new AiServiceError("The AI returned an unreadable response.");
  }

  return parsed;
};

// Coerce an AI-supplied score into a valid 0-10 integer
export const clampScore = (value, fallback = 0) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(10, Math.max(0, Math.round(n)));
};
