import { embedMany } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const EMBEDDING_MODEL = "nvidia/llama-nemotron-embed-vl-1b-v2";
export const EMBEDDING_DIMENSIONS = 1536;

type NvidiaProvider = ReturnType<typeof createOpenAICompatible>;

let cachedProvider: NvidiaProvider | null = null;

function getNvidiaProvider(): NvidiaProvider {
  if (!cachedProvider) {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) throw new Error("NVIDIA_API_KEY environment variable is not set");
    cachedProvider = createOpenAICompatible({
      baseURL: "https://integrate.api.nvidia.com/v1",
      apiKey,
      name: "nvidia",
    });
  }
  return cachedProvider;
}

// NOTE: the previous OpenAI-SDK implementation sent `input_type: "passage" | "query"`
// per call. The OpenAI-compatible embeddings API surface only models
// `{ dimensions, user }` as extra body params, so `input_type` can no longer be
// expressed. If passage/query asymmetry matters for retrieval quality, re-check
// RAG ranking after this change.
export async function nvidiaEmbed(input: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model: getNvidiaProvider().embeddingModel(EMBEDDING_MODEL),
    values: input,
    providerOptions: {
      openaiCompatible: { dimensions: EMBEDDING_DIMENSIONS },
    },
  });

  return embeddings;
}
