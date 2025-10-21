import {
  STORAGE_KEY_USER,
  STORAGE_KEY_TOKEN,
  STORAGE_KEY_EMAIL,
} from "./constants";
import { UserData } from "@shared/api";

export function setAuthToken(token: string) {
  localStorage.setItem(STORAGE_KEY_TOKEN, token);
}

export function getAuthToken(): string | null {
  return localStorage.getItem(STORAGE_KEY_TOKEN);
}

export function setUser(user: UserData) {
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
}

export function getUser(): UserData | null {
  const stored = localStorage.getItem(STORAGE_KEY_USER);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function setRememberedEmail(email: string) {
  localStorage.setItem(STORAGE_KEY_EMAIL, email);
  // Also set as cookie for longer persistence (30 days)
  const date = new Date();
  date.setTime(date.getTime() + 30 * 24 * 60 * 60 * 1000);
  document.cookie = `${STORAGE_KEY_EMAIL}=${email}; expires=${date.toUTCString()}; path=/`;
}

export function getRememberedEmail(): string | null {
  const storage = localStorage.getItem(STORAGE_KEY_EMAIL);
  if (storage) return storage;

  // Fallback to cookie
  const name = STORAGE_KEY_EMAIL + "=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(";");
  for (let cookie of cookieArray) {
    cookie = cookie.trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length);
    }
  }
  return null;
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_USER);
}

export function isAuthenticated(): boolean {
  return !!getAuthToken() && !!getUser();
}
