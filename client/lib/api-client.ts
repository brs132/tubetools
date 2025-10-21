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

    let text = "";

    // Try to read response body with fallback handling
    try {
      text = await response.text();
    } catch (bodyReadError) {
      // Handle "body stream already read" or other body reading errors
      if (bodyReadError instanceof TypeError) {
        console.error("Body stream error:", bodyReadError);
        // If we can't read the body, check status code
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        return {} as T;
      }
      throw bodyReadError;
    }

    if (!response.ok) {
      console.error(`API error ${response.status}:`, text);
      throw new Error(`API error: ${response.status}`);
    }

    if (!text) {
      return {} as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch (err) {
      console.error("Failed to parse JSON:", text);
      throw new Error("Invalid response format");
    }
  } catch (err) {
    if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
      console.error("Network error:", err);
      throw new Error("Network error - please check your connection");
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
