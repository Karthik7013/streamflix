export interface AiModelOption {
  id: string;
  label: string;
  description: string;
}

export const AI_MODELS: readonly AiModelOption[] = [
  {
    id: "nvidia/nemotron-3-ultra-550b-a55b",
    label: "Nemotron 3 Ultra 550B",
    description: "Highest quality — reliable tool calls and long answers",
  },
  {
    id: "nvidia/nemotron-3.5-lightning-30b-a3b",
    label: "Nemotron 3.5 Lightning 30B",
    description: "Fast and reliable — solid fallback",
  },
  {
    id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    label: "Nemotron 3 Nano Omni 30B",
    description: "Reasoning model — slower, used only when the others fail",
  },
  {
    id: "nvidia/nemotron-3.5-bolt-e4b",
    label: "Nemotron 3.5 Bolt 4B",
    description: "Very fast but weaker with tools — emergency fallback",
  },
];

export const DEFAULT_CHAT_MODEL = "nvidia/nemotron-3-ultra-550b-a55b";

export function isAllowedModel(id: string): boolean {
  return AI_MODELS.some((model) => model.id === id);
}

export function getModelOption(id: string): AiModelOption | undefined {
  return AI_MODELS.find((model) => model.id === id);
}

export function getModelChain(primary: string): string[] {
  const head = isAllowedModel(primary) ? primary : DEFAULT_CHAT_MODEL;
  return [head, ...AI_MODELS.map((model) => model.id).filter((id) => id !== head)];
}
