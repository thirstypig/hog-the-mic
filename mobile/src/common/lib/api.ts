/**
 * API configuration for the React Native client.
 *
 * The web app used relative URLs (e.g. "/api/songs") because the frontend
 * was served from the same origin.  React Native runs outside the browser
 * so we need an absolute base URL.
 */

// TODO: Read from an env var / Expo config plugin for production builds.
// For local development, use your machine's LAN IP (not localhost) so that
// the tvOS simulator / physical device can reach the Express server.
let _baseUrl = "http://192.168.6.12:3000";

export function setApiBaseUrl(url: string) {
  _baseUrl = url.replace(/\/+$/, "");
}

export function getApiBaseUrl(): string {
  return _baseUrl;
}

/**
 * Build a full API URL from a relative path.
 * e.g. apiUrl("/api/songs") → "http://192.168.1.42:3000/api/songs"
 */
export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${_baseUrl}${normalizedPath}`;
}
