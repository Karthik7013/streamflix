import { api } from "@/lib/api/client";

export interface HealthCheck {
  status: string;
  latencyMs: number | null;
}

export interface HealthData {
  status: string;
  uptime: number;
  responseTimeMs: number;
  checks: Record<string, HealthCheck>;
}

export const healthApi = {
  get: () => api<HealthData>("/api/health"),
};
