export function validateSlug(slug: string): string | null {
  if (!/^[a-z0-9-]+$/.test(slug) || slug.length === 0) {
    return "Slug must contain only lowercase letters, numbers, and hyphens";
  }
  return null;
}

export function generateSlug(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export function validateDuration(duration: unknown): string | null {
  if (
    duration !== undefined &&
    (typeof duration !== "number" || isNaN(duration) || duration < 0)
  ) {
    return "Invalid duration";
  }
  return null;
}
