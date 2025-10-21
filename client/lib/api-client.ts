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

    // Try to read response body, with multiple fallback strategies
    try {
      // First attempt: use text()
      text = await response.text();
    } catch (firstError) {
      // If text() fails, the body might already be consumed
      // Try to clone and read from the clone
      try {
        const clonedResponse = response.clone();
        text = await clonedResponse.text();
      } catch (secondError) {
        // If cloning also fails, we can't read the body
        console.error("Unable to read response body:", firstError);

        // For error responses, throw with status code
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        // For successful responses, return empty object
        return {} as T;
      }
    }

    // Check response status
    if (!response.ok) {
      let errorMessage = `API error: ${response.status}`;

      // Try to extract error details from response body
      if (text) {
        try {
          const errorData = JSON.parse(text);
          if (errorData.error) {
            errorMessage = `${response.status}: ${errorData.error}`;
          }
        } catch {
          // If we can't parse, use raw text if short enough
          if (text.length < 200) {
            errorMessage = `${response.status}: ${text}`;
          }
        }
      }

      console.error("API error response:", errorMessage);
      throw new Error(errorMessage);
    }

    // For successful responses
    if (!text) {
      return {} as T;
    }

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

      if (errorMessage.includes("Failed to fetch") ||
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
