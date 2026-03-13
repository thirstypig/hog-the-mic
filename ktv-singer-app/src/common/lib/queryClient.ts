import { QueryClient } from "@tanstack/react-query";
import { apiUrl } from "./api";

/**
 * Thin fetch wrapper that resolves relative paths against the API base URL,
 * throws on non-2xx responses, and forwards JSON bodies.
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  const res = await fetch(apiUrl(url), {
    method,
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }

  return res;
}

/**
 * Factory that returns a queryFn compatible with TanStack React Query.
 * Pass `on401: "returnNull"` for queries that should silently fail when
 * the user is unauthenticated (e.g. fetching the current user).
 */
export function getQueryFn(options?: { on401?: "returnNull" | "throw" }) {
  return async ({ queryKey }: { queryKey: readonly unknown[] }) => {
    const url = queryKey[0] as string;
    const res = await fetch(apiUrl(url));

    if (res.status === 401 && options?.on401 === "returnNull") {
      return null;
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${res.status}: ${text}`);
    }

    return res.json();
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn(),
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
