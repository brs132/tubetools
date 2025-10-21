import { getAuthToken } from "./auth";

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export async function apiCall<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    // Always handle response body safely
    let body: unknown;
    const contentType = response.headers.get("content-type");

    try {
      if (contentType?.includes("application/json")) {
        body = await response.clone().json();
      } else {
        const text = await response.clone().text();
        body = text ? JSON.parse(text) : {};
      }
    } catch {
      // If we can't parse the body, just get the raw text
      body = await response.text();
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return body as T;
  } catch (err) {
    if (err instanceof TypeError && err.message.includes("body stream")) {
      throw new Error("Server connection error");
    }
    throw err;
  }
}

export function apiGet<T>(endpoint: string): Promise<T> {
  return apiCall<T>(endpoint, { method: "GET" });
}

export function apiPost<T>(endpoint: string, data: unknown): Promise<T> {
  return apiCall<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
