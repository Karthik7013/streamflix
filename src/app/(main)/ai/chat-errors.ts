export function getFriendlyError(err: Error): string {
  const msg = err.message.toLowerCase();
  if (msg.includes("429") || msg.includes("too many requests") || msg.includes("rate limit")) {
    return "Too many requests — please wait a moment and try again.";
  }
  if (msg.includes("503") || msg.includes("overloaded") || msg.includes("unavailable")) {
    return "Model is overloaded — try a different model or try again later.";
  }
  if (msg.includes("500") || msg.includes("internal")) {
    return "Server error — please try again.";
  }
  if (msg.includes("timeout") || msg.includes("deadline")) {
    return "Request timed out — try a simpler question.";
  }
  if (msg.includes("api key") || msg.includes("unauthorized") || msg.includes("401")) {
    return "API key issue — please contact support.";
  }
  return err.message;
}

export const CHAT_SUGGESTIONS = [
  "What's trending on StreamFlix right now?",
  "Recommend a good sci-fi movie",
  "Show me some action movies",
  "How do I request a movie?",
  "How do I file a DMCA copyright notice?",
  "What data does StreamFlix collect about me?",
];
