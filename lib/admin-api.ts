const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchAdminAPI(endpoint: string, options?: RequestInit) {
  const token = typeof window !== "undefined" ? localStorage.getItem("kodwai_admin_token") : null;
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
    throw new Error(error.detail || "Request failed");
  }
  if (res.status === 204) return null;
  return res.json();
}

export const adminApi = {
  post: (endpoint: string, data: unknown) =>
    fetchAdminAPI(endpoint, { method: "POST", body: JSON.stringify(data) }),
  get: (endpoint: string) => fetchAdminAPI(endpoint),
  put: (endpoint: string, data: unknown) =>
    fetchAdminAPI(endpoint, { method: "PUT", body: JSON.stringify(data) }),
  patch: (endpoint: string, data?: unknown) =>
    fetchAdminAPI(endpoint, { method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
  delete: (endpoint: string) => fetchAdminAPI(endpoint, { method: "DELETE" }),
};
