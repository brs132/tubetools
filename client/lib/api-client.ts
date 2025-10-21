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

    // For 404/error responses, don't bother trying to read body
    // Just throw with status code
    if (response.status === 404) {
      throw new Error("API error: 404");
    }

    if (response.status === 401) {
      throw new Error("Unauthorized");
    }

    // For other error statuses, attempt to read body once
    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
      } catch (readErr) {
        // If we can't read the body, just use status code
        throw new Error(`API error: ${response.status}`);
      }

      let errorMessage = `API error: ${response.status}`;
      if (errorText) {
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // Not JSON, just use raw text if short
          if (errorText.length < 200) {
            errorMessage = errorText;
          }
        }
      }
      throw new Error(errorMessage);
    }

    // For successful responses, try to read the body
    let text = "";
    try {
      text = await response.text();
    } catch (readErr) {
      // Body already consumed - return empty object
      console.warn("Could not read response body (likely consumed by proxy)");
      return {} as T;
    }

    // Parse the response
    if (!text || text.trim() === "") {
      return {} as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch (parseErr) {
      console.error("Failed to parse JSON:", text.substring(0, 100));
      throw new Error("Invalid response format");
    }
  } catch (err) {
    // Handle network-level errors
    if (err instanceof TypeError) {
      const msg = err.message || "Unknown error";

      // Don't try to parse body stream errors - just report
      if (msg.includes("body stream") || msg.includes("already used")) {
        console.warn("Response body consumed by proxy");
        throw new Error("Connection issue - please try again");
      }

      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        throw new Error("Network error - please check your connection");
      }

      throw new Error("Connection error");
    }

    // Re-throw application errors
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
