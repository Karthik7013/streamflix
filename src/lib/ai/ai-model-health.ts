import type { AiErrorKind } from "@/lib/ai-errors";
import { AI_MODELS, getModelChain } from "@/lib/ai-models";

export type ModelHealthStatus = "healthy" | "degraded" | "unhealthy" | "unknown";

export interface ModelHealth {
  id: string;
  status: ModelHealthStatus;
  latencyMs: number | null;
  checkedAt: number;
  error: AiErrorKind | null;
}

interface HealthEntry extends ModelHealth {
  expiresAt: number;
}

const HEALTHY_TTL_MS = 30 * 60 * 1000;

const FAILURE_TTL_MS: Record<AiErrorKind, number> = {
  model_unavailable: 30 * 60 * 1000,
  model_rate_limited: 5 * 60 * 1000,
  model_timeout: 5 * 60 * 1000,
  model_overloaded: 5 * 60 * 1000,
  provider_auth: 5 * 60 * 1000,
  model_empty: 5 * 60 * 1000,
  unknown: 5 * 60 * 1000,
};

const SKIPPED_KINDS: readonly AiErrorKind[] = [
  "model_unavailable",
  "model_rate_limited",
  "model_timeout",
  "model_overloaded",
];

const healthStore = new Map<string, HealthEntry>();

export function recordModelFailure(id: string, kind: AiErrorKind): void {
  const now = Date.now();
  healthStore.set(id, {
    id,
    status: SKIPPED_KINDS.includes(kind) ? "unhealthy" : "degraded",
    latencyMs: null,
    checkedAt: now,
    error: kind,
    expiresAt: now + FAILURE_TTL_MS[kind],
  });
}

export function recordModelSuccess(id: string, latencyMs: number): void {
  const now = Date.now();
  healthStore.set(id, {
    id,
    status: "healthy",
    latencyMs,
    checkedAt: now,
    error: null,
    expiresAt: now + HEALTHY_TTL_MS,
  });
}

function readHealth(id: string): ModelHealth | undefined {
  const entry = healthStore.get(id);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    healthStore.delete(id);
    return undefined;
  }
  const { expiresAt: _expiresAt, ...health } = entry;
  return health;
}

export function getModelHealth(id: string): ModelHealth {
  return (
    readHealth(id) ?? {
      id,
      status: "unknown",
      latencyMs: null,
      checkedAt: 0,
      error: null,
    }
  );
}

export function getAllModelHealth(): ModelHealth[] {
  return AI_MODELS.map((model) => getModelHealth(model.id));
}

export function getHealthyModelChain(primary: string): string[] {
  const chain = getModelChain(primary);
  const usable = chain.filter((id) => readHealth(id)?.status !== "unhealthy");
  return usable.length > 0 ? usable : chain;
}

export function resetModelHealth(): void {
  healthStore.clear();
}
