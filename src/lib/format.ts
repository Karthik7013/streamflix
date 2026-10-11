export function formatDuration(seconds: number | null | undefined): string | null {
  if (seconds === null || seconds === undefined) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function formatYear(date: string | null | undefined): string | null {
  if (!date) return null;
  return new Date(date).getFullYear().toString();
}

export function formatMinutes(seconds: number | null | undefined): number | null {
  if (seconds === null || seconds === undefined) return null;
  return Math.round(seconds / 60);
}

export function generateSlug(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
