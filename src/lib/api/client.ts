export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function redirectOnSessionExpired(status: number): void {
  if ((status === 401 || status === 403) && typeof window !== "undefined") {
    window.location.href = "/login?sessionExpired=1";
  }
}

export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (res.status === 404) {
    throw new ApiError("Not found", 404, "not-found");
  }

  if (!res.ok) {
    redirectOnSessionExpired(res.status);
    const text = await res.text().catch(() => "");
    throw new ApiError(text || `Request failed: ${res.status}`, res.status);
  }

  return res.json();
}

export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, options);
  if (!res.ok) {
    redirectOnSessionExpired(res.status);
  }
  return res;
}
