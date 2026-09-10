import { GoogleGenAI } from "@google/genai";

/**
 * LLM service — thin wrapper so the controller doesn't care which provider
 * is configured. Defaults to Google Gemini API; falls back to a rule-based
 * canned response if no API key is present or on call failures.
 */

const SYSTEM_PROMPT = `You are Krishak Sahayak, a fast, practical AI assistant for Indian farmers
inside the Krishak Unnayan app. You help with:
- mandi (market) prices, procurement slot booking, and queue status
- crop advisory (sowing time, irrigation, pest/disease basics, fertilizer dosage)
- weather-aware harvest and selling timing
- government scheme and MSP (minimum support price) information

Rules:
- Reply in the SAME language the user wrote in (English, Hindi, Bengali, Marathi, etc.).
- Keep answers short, concrete, and actionable — farmers are often on a slow connection reading on a small screen.
- Use simple words. Give numbers/prices when you have them from the provided context.
- If you are not certain of a live price or fact, say so plainly instead of guessing.
- Use NO markdown formatting such as asterisks (*), underscores (_), backticks, or backslashes (\) in your response. Write purely in plain, conversational text using simple line breaks and numbers for lists.`;

const DEFAULT_TIMEOUT_MS = 10000;

/**
 * Maps standard open-role messages ({role: 'user'|'assistant', content: string})
 * to the format expected by the Google Gen AI SDK ('user' | 'model').
 */
function formatMessagesForGemini(messages) {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
}

async function callGoogle({ apiKey, model, messages, context }) {
  const ai = new GoogleGenAI({ apiKey });
  const selectedModel = model || "gemini-3.6-flash";

  // Combine system instructions with contextual user details
  const systemInstruction = context
    ? `${SYSTEM_PROMPT}\n\nContext for this user:\n${context}`
    : SYSTEM_PROMPT;

  const contents = formatMessagesForGemini(messages);

  // Add abort controller timeout to prevent hanging fetch calls
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config: {
        systemInstruction,
        maxOutputTokens: 1500,
        temperature: 0.3, // Lower temperature for more factual responses
      },
      requestOptions: {
        signal: controller.signal,
      },
    });

    return response.text || "";
  } finally {
    clearTimeout(timeoutId);
  }
}

function canned(userText) {
  return (
    "I'm running in demo mode (no GEMINI_API_KEY set). " +
    "Once you add a Gemini key to backend/.env, I'll answer questions like:\n\n" +
    `"${userText}"\n\n` +
    "with live, multilingual, voice-ready responses about mandi prices, crop advisory, and procurement slots."
  );
}

export async function getAssistantReply({ messages, context }) {
  // Support both process.env.GEMINI_API_KEY and general process.env.LLM_API_KEY
  const apiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL || process.env.GEMINI_MODEL;
  const lastUserText = [...messages].reverse().find((m) => m.role === "user")?.content || "";

  if (!apiKey) return canned(lastUserText);

  try {
    return await callGoogle({ apiKey, model, messages, context });
  } catch (err) {
    console.error("[llm.service] Google Gen AI provider call failed:", err.message);
    return canned(lastUserText);
  }
}
