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

function parseErrorBody(text: string, status: number): { message: string; code?: string } {
  if (!text) return { message: `Request failed: ${status}` };
  try {
    const parsed = JSON.parse(text);
    if (parsed?.error) {
      if (typeof parsed.error === "string") return { message: parsed.error };
      return { message: parsed.error.message ?? `Request failed: ${status}`, code: parsed.error.code };
    }
    return { message: parsed.message ?? `Request failed: ${status}` };
  } catch {
    return { message: text };
  }
}

export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {};
  if (!(options?.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(url, {
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string>) },
  });

  if (!res.ok) {
    redirectOnSessionExpired(res.status);
    const text = await res.text().catch(() => "");
    const { message, code } = parseErrorBody(text, res.status);
    throw new ApiError(message, res.status, code);
  }

  return res.json();
}

export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, options);
  if (!res.ok) {
    redirectOnSessionExpired(res.status);
    const text = await res.text().catch(() => "");
    const { message, code } = parseErrorBody(text, res.status);
    throw new ApiError(message, res.status, code);
  }
  return res;
}
