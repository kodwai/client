const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
    throw new Error(error.detail || "Request failed");
  }
  return res.json();
}

export const api = {
  post: (endpoint: string, data: unknown) =>
    fetchAPI(endpoint, { method: "POST", body: JSON.stringify(data) }),
  get: (endpoint: string) => fetchAPI(endpoint),
  put: (endpoint: string, data: unknown) =>
    fetchAPI(endpoint, { method: "PUT", body: JSON.stringify(data) }),
  delete: (endpoint: string) => fetchAPI(endpoint, { method: "DELETE" }),
};
