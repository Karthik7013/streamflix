import type { ToolSet } from "ai";
import { searchMovies, getRelatedMovies } from "@/services/movies";
import { getAllTags, getMoviesByTag } from "@/services/tags";
import { searchMoviesRag } from "@/lib/rag";
import { searchDocsRag } from "@/lib/docs";
import { getTop10Movies } from "@/services/top10-movies";
import {
  chatEmptySchema,
  chatSearchMoviesSchema,
  chatMoviesByGenreSchema,
  chatMoviesByDescriptionSchema,
  chatPlatformDocsSchema,
  chatTop10Schema,
  chatRelatedSchema,
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
  getTop10Movies: {
    description: "Get top 10 movies (based on recent uploads). Use when user asks for top 10, popular, or trending.",
    inputSchema: chatTop10Schema,
    execute: async () => {
      try {
        const result = await getTop10Movies();
        return result.map((m) => ({
          title: m.title,
          slug: m.slug,
          thumbnailUrl: m.thumbnailUrl,
        }));
      } catch (err) {
        return toolFailure("getTop10Movies", err);
      }
    },
  },
  getRelatedMovies: {
    description: "Get related movies for a given movie slug. Use when user asks for similar/related movies.",
    inputSchema: chatRelatedSchema,
    execute: async ({ slug }: { slug: string }) => {
      try {
        const result = await getRelatedMovies(slug);
        return result.map((m) => ({
          title: m.title,
          slug: m.slug,
          thumbnailUrl: m.thumbnailUrl,
        }));
      } catch (err) {
        return toolFailure("getRelatedMovies", err);
      }
    },
  },
};
