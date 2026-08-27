import { streamText, UIMessage, convertToModelMessages, stepCountIs } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { searchMovies } from "@/services/movies";
import { listSeries } from "@/services/series";
import { getAllTags, getMoviesByTag } from "@/services/tags";

export const maxDuration = 30;

const VALID_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tools: Record<string, any> = {
  searchMovies: {
    description:
      "Search for movies by keyword. Use this when the user asks about movies, wants to find movies, or mentions a topic they want movies about.",
    parameters: z.object({
      query: z.string().describe("The search keyword or phrase"),
    }),
    execute: async ({ query }: { query: string }) => {
      const result = await searchMovies({ q: query, limit: 5 });
      return result.data.map((m) => {
        const row = m as typeof m & { tags?: { name: string }[] };
        return {
          title: row.title,
          slug: row.slug,
          thumbnailUrl: row.thumbnailUrl,
          tags: row.tags?.map((t) => t.name) ?? [],
        };
      });
    },
  },
  searchSeries: {
    description:
      "Search for TV series by keyword. Use this when the user asks about series, shows, or TV shows.",
    parameters: z.object({
      query: z.string().describe("The search keyword or phrase"),
    }),
    execute: async ({ query }: { query: string }) => {
      const result = await listSeries({ q: query, limit: 5 });
      return result.data.map((s) => ({
        title: s.title,
        slug: s.slug,
        thumbnailUrl: s.thumbnailUrl,
      }));
    },
  },
  getMoviesByGenre: {
    description:
      "Get movies by genre/tag. Use this when the user asks for movies in a specific genre like action, comedy, horror, etc.",
    parameters: z.object({
      genre: z
        .string()
        .describe(
          "The genre or tag name (e.g., 'action', 'comedy', 'sci-fi')"
        ),
    }),
    execute: async ({ genre }: { genre: string }) => {
      const allTags = await getAllTags();
      const tag = allTags.find(
        (t) => t.name.toLowerCase() === genre.toLowerCase()
      );
      if (!tag) {
        return {
          error: `Genre "${genre}" not found`,
          availableGenres: allTags.map((t) => t.name),
        };
      }
      const result = await getMoviesByTag(tag.slug, 1, 5);
      if ("error" in result) {
        return { error: "Failed to fetch movies", availableGenres: [] };
      }
      return {
        genre: tag.name,
        movies: result.data.map((m) => ({
          title: m.title,
          slug: m.slug,
          thumbnailUrl: m.thumbnailUrl,
        })),
      };
    },
  },
  getAllGenres: {
    description:
      "Get all available genres/tags. Use this when the user wants to know what genres are available.",
    parameters: z.object({}),
    execute: async () => {
      const tags = await getAllTags();
      return tags.map((t) => ({
        name: t.name,
        slug: t.slug,
      }));
    },
  },
  getTrendingMovies: {
    description:
      "Get trending or latest movies. Use this when the user asks about trending, new, popular, or latest movies.",
    parameters: z.object({}),
    execute: async () => {
      const result = await searchMovies({
        sortBy: "createdAt",
        sortDir: "desc",
        limit: 5,
      });
      return result.data.map((m) => {
        const row = m as typeof m & { tags?: { name: string }[] };
        return {
          title: row.title,
          slug: row.slug,
          thumbnailUrl: row.thumbnailUrl,
          tags: row.tags?.map((t) => t.name) ?? [],
        };
      });
    },
  },
  getTrendingSeries: {
    description:
      "Get trending or latest TV series. Use this when the user asks about trending or new shows.",
    parameters: z.object({}),
    execute: async () => {
      const result = await listSeries({
        sortBy: "createdAt",
        sortDir: "desc",
        limit: 5,
      });
      return result.data.map((s) => ({
        title: s.title,
        slug: s.slug,
        thumbnailUrl: s.thumbnailUrl,
      }));
    },
  },
};

export async function POST(req: Request) {
  const { messages, model }: { messages: UIMessage[]; model?: string } =
    await req.json();

  const selectedModel = VALID_MODELS.includes(model as any)
    ? model!
    : "gemini-2.5-flash-lite";

  const result = streamText({
    model: google(selectedModel),
    system: `You are a helpful assistant for StreamFlix, a streaming platform.
You can search and recommend movies and series from the StreamFlix catalog.

When presenting movie or series results, ALWAYS format them as markdown with the thumbnail image:

## [Title](https://streamflix.dev/movies/slug)

![thumbnail](thumbnailUrl)

Description and details here...

**Rules:**
- Always use the thumbnail image in results so users can see the movie poster
- Link to /movies/{slug} for movies and /series/{slug} for series
- Keep descriptions concise
- If no results found, say so and suggest trying a different search
- Recommend content based on what the user is looking for`,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: [stepCountIs(2)],
  });

  return result.toUIMessageStreamResponse();
}
