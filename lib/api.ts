const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/** An HTTP error from the API, carrying the status so callers can branch on it. */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * True for 4xx API responses: wrong password, unverified email, duplicate
 * account, rate limits. These are expected user outcomes, not bugs, so they
 * should not be reported as exceptions.
 */
export function isExpectedClientError(err: unknown): boolean {
  return err instanceof ApiError && err.status >= 400 && err.status < 500;
}

function errorMessage(detail: unknown): string {
  if (typeof detail === "string" && detail) return detail;
  // FastAPI validation errors arrive as [{ msg, loc, ... }].
  if (Array.isArray(detail) && typeof detail[0]?.msg === "string") return detail[0].msg;
  return "Request failed";
}

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new ApiError(errorMessage(error?.detail), res.status);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  post: (endpoint: string, data: unknown) =>
    fetchAPI(endpoint, { method: "POST", body: JSON.stringify(data) }),
  get: (endpoint: string) => fetchAPI(endpoint),
  put: (endpoint: string, data: unknown) =>
    fetchAPI(endpoint, { method: "PUT", body: JSON.stringify(data) }),
  patch: (endpoint: string, data: unknown) =>
    fetchAPI(endpoint, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (endpoint: string) => fetchAPI(endpoint, { method: "DELETE" }),
};
