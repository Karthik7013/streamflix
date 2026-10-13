import { logger } from "@/lib/logger";

export const EMBEDDING_MODEL = "nvidia/llama-nemotron-embed-vl-1b-v2";
export const EMBEDDING_DIMENSIONS = 1536;

const NVIDIA_EMBEDDINGS_URL = "https://integrate.api.nvidia.com/v1/embeddings";

export type EmbedInputType = "query" | "passage";

// NOTE: this model is asymmetric — NVIDIA requires `input_type` ("query" for
// searches, "passage" for indexed content) and rejects requests without it.
// The @ai-sdk/openai-compatible v2 surface only models `{ dimensions, user }`
// as extra body params, so the SDK cannot express `input_type` (every call
// 400s). We call the REST endpoint directly instead. Keep this file on fetch;
// do not migrate back to the SDK without re-running the mocked-fetch fidelity
// check in src/lib/nvidia.test.ts.
export async function nvidiaEmbed(
  input: string[],
  inputType: EmbedInputType
): Promise<number[][]> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error("NVIDIA_API_KEY environment variable is not set");

  let res: Response;
  try {
    res = await fetch(NVIDIA_EMBEDDINGS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input,
        input_type: inputType,
        dimensions: EMBEDDING_DIMENSIONS,
      }),
    });
  } catch (err) {
    logger.error("nvidia", "Embeddings request failed", err);
    throw new Error("Embeddings request failed");
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    logger.error("nvidia", `Embeddings rejected (${res.status})`, detail.slice(0, 300));
    throw new Error(`Embeddings rejected (${res.status})`);
  }

  const json = (await res.json()) as {
    data?: { embedding?: number[] }[];
  };
  const embeddings = (json.data ?? []).map((d) => d.embedding ?? []);
  if (embeddings.length !== input.length) {
    throw new Error("Embeddings response length mismatch");
  }
  return embeddings;
}
