import { streamText, UIMessage, convertToModelMessages, stepCountIs } from "ai";
import { NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { chatApiSchema } from "@/lib/schemas";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getCachedSession } from "@/lib/session";
import { chatTools } from "@/lib/chat-tools";

export const maxDuration = 30;

const kilocode = createOpenAI({
  baseURL: "https://api.kilo.ai/api/gateway",
  apiKey: process.env.KILOCODE_API_KEY,
});

export async function POST(req: Request) {
  const session = await getCachedSession(req as never);
  const userId = session?.user?.id ?? (req.headers.get("x-forwarded-for") ?? "anonymous");
  const { allowed } = await rateLimit(`chat:${userId}`, 5, 60_000);
  if (!allowed) return rateLimitResponse();

  const body = await req.json();
  const parsed = chatApiSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Validation failed", code: "VALIDATION_ERROR" } },
      { status: 400 }
    );
  }
  const { messages, model } = parsed.data;

  const resolvedModel = model || "kilo-auto/free";

  const result = streamText({
    model: kilocode(resolvedModel),
    system: `You are a helpful assistant for StreamFlix, a streaming platform.
You can search and recommend movies from the StreamFlix catalog.

When tools return movie results, they are automatically displayed as beautiful cards in the UI.
You do NOT need to format results as markdown images or links — just acknowledge the results naturally.

**Rules:**
- Keep responses concise and conversational
- When tools return results, briefly describe what was found (e.g., "Here are some action movies you might enjoy!")
- If no results found, say so and suggest trying a different search
- Recommend content based on what the user is looking for
- Use searchMovies when the user names a title or keyword.
- Use searchMoviesByDescription when the user describes a plot, theme, or vibe instead of a title.
- Use searchPlatformDocs for questions about how StreamFlix itself works (features, accounts, watchlist, requests, reports, settings). Base your answer on the articles it returns and briefly cite them.
- Never use markdown image syntax — the UI handles rendering automatically`,
    messages: await convertToModelMessages(messages as UIMessage[]),
    tools: chatTools,
    stopWhen: [stepCountIs(2)],
  });

  return result.toUIMessageStreamResponse();
}
