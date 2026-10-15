import type { ToolSet } from "ai";
import { searchMovies } from "@/services/movies";
import { getAllTags, getMoviesByTag } from "@/services/tags";
import { searchMoviesRag } from "@/lib/rag";
import { searchDocsRag } from "@/lib/docs";
import {
  chatEmptySchema,
  chatSearchMoviesSchema,
  chatMoviesByGenreSchema,
  chatMoviesByDescriptionSchema,
  chatPlatformDocsSchema,
} from "@/lib/schemas";
import { logger } from "@/lib/logger";

function toolFailure(tool: string, err: unknown): { error: string } {
  logger.error("chat", `Tool ${tool} failed`, err);
  return { error: "That search is unavailable right now. Please try again." };
}

export const userTools: ToolSet = {
  searchMovies: {
    description:
      "Search for movies by keyword. Use this when the user asks about movies, wants to find movies, or mentions a topic they want movies about.",
    inputSchema: chatSearchMoviesSchema,
    execute: async ({ query }: { query: string }) => {
      try {
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
      } catch (err) {
        return toolFailure("searchMovies", err);
      }
    },
  },
  getMoviesByGenre: {
    description:
      "Get movies by genre/tag. Use this when the user asks for movies in a specific genre like action, comedy, horror, etc.",
    inputSchema: chatMoviesByGenreSchema,
    execute: async ({ genre }: { genre: string }) => {
      try {
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
        const result = await getMoviesByTag(tag.slug, undefined, 5);
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
      } catch (err) {
        return { ...toolFailure("getMoviesByGenre", err), availableGenres: [] as string[] };
      }
    },
  },
  getAllGenres: {
    description:
      "Get all available genres/tags. Use this when the user wants to know what genres are available.",
    inputSchema: chatEmptySchema,
    execute: async () => {
      try {
        const tags = await getAllTags();
        return tags.map((t) => ({
          name: t.name,
          slug: t.slug,
        }));
      } catch (err) {
        return toolFailure("getAllGenres", err);
      }
    },
  },
  searchMoviesByDescription: {
    description:
      "Search the movie catalog by plot, theme, or vibe — not title keywords. " +
      "Use this when the user describes a movie they're thinking of ('a movie about " +
      "someone stranded on Mars', 'a heist film with a twist', 'a feel-good 90s comedy') " +
      "or asks for recommendations based on concepts the title search can't match. " +
      "Results render as movie cards automatically.",
    inputSchema: chatMoviesByDescriptionSchema,
    execute: async ({ query }: { query?: string }) => {
      if (!query?.trim()) {
        return {
          movies: [],
          sources: [],
          error: "No search query provided",
        };
      }
      try {
        const movies = await searchMoviesRag(query, 5);
        return { movies, sources: [] };
      } catch (err) {
        return { movies: [], sources: [], ...toolFailure("searchMoviesByDescription", err) };
      }
    },
  },
  getTrendingMovies: {
    description:
      "Get trending or latest movies. Use this when the user asks about trending, new, popular, or latest movies.",
    inputSchema: chatEmptySchema,
    execute: async () => {
      try {
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
      } catch (err) {
        return toolFailure("getTrendingMovies", err);
      }
    },
  },
  searchPlatformDocs: {
    description:
      "Answer questions about how the StreamFlix platform itself works — its features, accounts and sign-in, " +
      "watchlist, requesting movies, reporting issues, comments, shorts, settings, and the AI assistant. " +
      "Use this when the user asks 'how do I...', 'what is...', or 'where can I...' about StreamFlix. " +
      "Returns relevant help articles; base your answer on their content and cite them.",
    inputSchema: chatPlatformDocsSchema,
    execute: async ({ question }: { question: string }) => {
      if (!question?.trim()) {
        return { sources: [], error: "No question provided" };
      }
      try {
        const sources = await searchDocsRag(question, 3);
        return {
          sources,
          error: sources.length === 0 ? "No matching help articles found" : undefined,
        };
      } catch (err) {
        return { sources: [], ...toolFailure("searchPlatformDocs", err) };
      }
    },
  },
};
