/**
 * API configuration for the React Native client.
 *
 * The web app used relative URLs (e.g. "/api/songs") because the frontend
 * was served from the same origin.  React Native runs outside the browser
 * so we need an absolute base URL.
 */

// TODO: Read from an env var / Expo config plugin for production builds.
// Defaults to localhost for simulator/dev. Physical devices get the correct
// URL from QR code scanning or manual entry (setApiBaseUrl).
let _baseUrl = __DEV__ ? "http://192.168.4.23:4040" : "http://localhost:4040";

export function setApiBaseUrl(url: string) {
  _baseUrl = url.replace(/\/+$/, "");
}

export function getApiBaseUrl(): string {
  return _baseUrl;
}

/**
 * Build a full API URL from a relative path.
 * e.g. apiUrl("/api/songs") → "http://localhost:4040/api/songs"
 */
export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${_baseUrl}${normalizedPath}`;
}
