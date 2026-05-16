export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("noderift_token");
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "API request failed");
  }

  if (response.status !== 204) {
    return response.json();
  }
}
