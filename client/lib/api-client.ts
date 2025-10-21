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
    let readSuccess = false;

    // Try to read response body using text() with multiple fallback strategies
    try {
      text = await response.text();
      readSuccess = true;
    } catch (firstError) {
      // If text() fails, try cloning the response
      console.warn("Initial text() failed, attempting clone fallback", firstError);

      try {
        // Clone allows us to read the response again
        const cloned = response.clone();
        text = await cloned.text();
        readSuccess = true;
      } catch (secondError) {
        console.error("Clone fallback also failed", secondError);
        // Both strategies failed - we can't read the body
        // Use status code to determine what to return
        if (response.ok) {
          // Successful response with unreadable body - return empty
          return {} as T;
        } else {
          // Error response with unreadable body
          throw new Error(`API error: ${response.status}`);
        }
      }
    }

    // At this point, readSuccess should be true and text should contain the body
    if (!response.ok) {
      let errorMessage = `API error: ${response.status}`;

      if (readSuccess && text) {
        try {
          const errorData = JSON.parse(text);
          if (errorData.error) {
            errorMessage = `${response.status}: ${errorData.error}`;
          }
        } catch {
          // Response is not JSON
          if (text.length < 200) {
            errorMessage = `${response.status}: ${text}`;
          }
        }
      }

      console.error("API error:", errorMessage);
      throw new Error(errorMessage);
    }

    // Handle successful response (2xx status)
    if (!text || text.trim() === "") {
      return {} as T;
    }

    try {
      const parsed = JSON.parse(text) as T;
      return parsed;
    } catch (parseErr) {
      console.error("JSON parse error:", text.substring(0, 200));
      throw new Error("Invalid JSON response");
    }
  } catch (err) {
    // Handle TypeError separately for network-related errors
    if (err instanceof TypeError) {
      const msg = err.message || "Unknown error";
      console.error("TypeError caught:", msg);

      // Check for specific network error patterns
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        throw new Error("Network error - please check your connection");
      }

      throw new Error(`Connection error: ${msg}`);
    }

    // For all other errors, re-throw as-is
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
