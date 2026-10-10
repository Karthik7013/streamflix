import { CheckCircle, XCircle, MinusCircle } from "lucide-react";

export function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(" ");
}

export function StatusIcon({ status }: { status: string }) {
  if (status === "ok") return <CheckCircle className="size-5 text-emerald-500" />;
  if (status === "error") return <XCircle className="size-5 text-rose-500" />;
  return <MinusCircle className="size-5 text-muted-foreground" />;
}

export function statusLabel(status: string) {
  if (status === "ok") return "Operational";
  if (status === "error") return "Unreachable";
  if (status === "unconfigured") return "Not Configured";
  return status;
}

export const serviceNames: Record<string, string> = {
  db: "PostgreSQL",
  redis: "Redis",
};
