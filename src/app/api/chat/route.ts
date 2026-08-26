import { streamText, UIMessage, convertToModelMessages } from "ai";
import { google } from "@ai-sdk/google";

export const maxDuration = 30;

const VALID_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
] as const;

export async function POST(req: Request) {
  const { messages, model }: { messages: UIMessage[]; model?: string } =
    await req.json();

  const selectedModel = VALID_MODELS.includes(model as any)
    ? model!
    : "gemini-2.5-flash-lite";

  const result = streamText({
    model: google(selectedModel),
    system:
      "You are a helpful assistant for StreamFlix, a streaming platform. Help users find movies, series, and answer questions about the platform. Be concise and friendly.",
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
