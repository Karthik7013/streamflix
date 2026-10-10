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

function getVectorConfig(): { url: string; token: string } {
  const url = process.env.UPSTASH_VECTOR_REST_URL;
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN;
  if (!url || !token)
    throw new Error("UPSTASH_VECTOR_REST_URL/TOKEN environment variables are not set");
  return { url, token };
}

let cachedIndex: Index<ChunkMetadata> | null = null;

export function getVectorIndex(): Index<ChunkMetadata> {
  if (!cachedIndex) {
    const { url, token } = getVectorConfig();
    cachedIndex = new Index<ChunkMetadata>({ url, token });
  }
  return cachedIndex;
}