import OpenAI from "openai";

export const EMBEDDING_MODEL = "nvidia/llama-nemotron-embed-vl-1b-v2";
export const EMBEDDING_DIMENSIONS = 1536;

let cachedClient: OpenAI | null = null;

function getNvidiaClient(): OpenAI {
  if (!cachedClient) {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) throw new Error("NVIDIA_API_KEY environment variable is not set");
    cachedClient = new OpenAI({
      baseURL: "https://integrate.api.nvidia.com/v1",
      apiKey,
    });
  }
  return cachedClient;
}

export type EmbeddingInputType = "passage" | "query";

interface NvidiaEmbeddingRequest {
  model: string;
  input: string[];
  dimensions?: number;
  input_type?: EmbeddingInputType;
}

export async function nvidiaEmbed(
  input: string[],
  type: EmbeddingInputType
): Promise<number[][]> {
  const response = await getNvidiaClient().embeddings.create({
    model: EMBEDDING_MODEL,
    input,
    dimensions: EMBEDDING_DIMENSIONS,
    input_type: type,
  } as NvidiaEmbeddingRequest);

  return response.data.map((d) => d.embedding);
}