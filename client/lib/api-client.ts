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

  let response: Response | null = null;

  try {
    response = await fetch(endpoint, {
      ...options,
      headers,
    });

    let text = "";

    // Try to read response body with fallback handling
    try {
      text = await response.text();
    } catch (bodyReadError) {
      // Handle "body stream already read" or other body reading errors
      console.error("Body stream error:", bodyReadError);
      // If we can't read the body, use status code alone
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      // For successful responses where we can't read the body, return empty object
      return {} as T;
    }

    // Check response status
    if (!response.ok) {
      // Try to parse error response
      let errorMessage = `API error: ${response.status}`;
      if (text) {
        try {
          const errorData = JSON.parse(text);
          if (errorData.error) {
            errorMessage = `${response.status}: ${errorData.error}`;
          }
        } catch {
          // If error response isn't JSON, just use the text
          if (text.length < 200) {
            errorMessage = `${response.status}: ${text}`;
          }
        }
      }
      console.error("API error response:", errorMessage);
      throw new Error(errorMessage);
    }

    if (!text) {
      return {} as T;
    }

    // Parse successful response
    try {
      return JSON.parse(text) as T;
    } catch (parseErr) {
      console.error("Failed to parse JSON response:", text.substring(0, 100));
      throw new Error("Invalid response format");
    }
  } catch (err) {
    // Handle network errors and other fetch-level errors
    if (err instanceof TypeError) {
      const errorMessage = err.message || "Unknown error";
      console.error("Fetch error:", errorMessage);

      // Provide a user-friendly message for network issues
      if (errorMessage.includes("Failed to fetch") ||
          errorMessage.includes("body stream already read") ||
          errorMessage.includes("NetworkError")) {
        throw new Error("Network error - please check your connection");
      }
      throw new Error(`Network error: ${errorMessage}`);
    }

    // Re-throw other errors
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
