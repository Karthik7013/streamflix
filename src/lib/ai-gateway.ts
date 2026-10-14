import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const NVIDIA_CHAT_BASE_URL = "https://integrate.api.nvidia.com/v1";

export const DEFAULT_CHAT_MODEL = "openai/gpt-oss-20b";

export const FALLBACK_CHAT_MODEL = "nvidia/nemotron-3-nano-30b-a3b";

export const nvidia = createOpenAICompatible({
  baseURL: NVIDIA_CHAT_BASE_URL,
  apiKey: process.env.NVIDIA_API_KEY,
  name: "nvidia",
});
