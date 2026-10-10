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

// NOTE: two constraints, read before touching this file.
// 1. @ai-sdk/openai-compatible must stay on v2 (^2 in package.json already
//    blocks v3). v3 implements model spec V4, which throws
//    UnsupportedModelVersionError against this repo's ai@6 (spec V3) at
//    RUNTIME — tsc cannot catch it. Only upgrade alongside an ai major bump,
//    then re-run the mocked-fetch fidelity check.
// 2. The previous OpenAI-SDK implementation sent `input_type: "passage" | "query"`
//    per call. The OpenAI-compatible embeddings API surface only models
//    `{ dimensions, user }` as extra body params, so `input_type` can no longer be
//    expressed. After deploying this change, re-run `npm run rag:ingest` and
//    `npm run docs:ingest` so the index is rebuilt consistently, then sanity-check
//    description search ("stranded on Mars", "heist film with a twist") before
//    trusting RAG ranking.
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
