import { stepCountIs, type UIMessage } from "ai";
import { NextResponse } from "next/server";
import { createChatStreamResponse } from "@/lib/ai-chat";
import { userTools } from "@/services/chat-tools";
import {
  chatApiSchema,
} from "@/lib/schemas";
import { rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { withOptionalAuth } from "@/lib/with-auth";
import { ErrorCode } from "@/lib/api-errors";

export const maxDuration = 120;

export const POST = withOptionalAuth(async (req, { session }) => {
  const userId = session?.user?.id ?? (req.headers.get("x-forwarded-for") ?? "anonymous");
  const { allowed } = await rateLimit(`chat:${userId}`, RATE_LIMITS.chat);
  if (!allowed) return rateLimitResponse();

  const body = await req.json();
  const parsed = chatApiSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Validation failed", code: ErrorCode.ValidationError } },
      { status: 400 }
    );
  }
  const { messages } = parsed.data;

  return createChatStreamResponse({
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
    messages: messages as UIMessage[],
    tools: userTools,
    stopWhen: [stepCountIs(2)],
  });
});
