import { Index } from "@upstash/vector";

export type ChunkMetadata = {
  content: string;
  source: string;
  type: "movie" | "docs";
  movieId?: number;
  slug?: string;
  thumbnailUrl?: string;
  overview?: string;
  url?: string;
  summary?: string;
  category?: string;
};

export const vectorIndex = new Index<ChunkMetadata>({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});