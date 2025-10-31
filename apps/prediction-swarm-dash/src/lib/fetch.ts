import { env } from "~/env";
import dayjs from "dayjs";
import { useAuthStore } from "./auth-store";

export function getCurrentSessionToken(): string | null {
  const session = useAuthStore.getState().session;
  return session?.session_token ?? null;
}

export function isTokenExpired(): boolean {
  const session = useAuthStore.getState().session;

  if (!session?.session_token) {
    return false;
  }

  if (dayjs(session.expires_at).isBefore(dayjs())) {
    useAuthStore.getState().clearSession();
    return true;
  }

  return false;
}

export function shouldRefreshSession(): boolean {
  const session = useAuthStore.getState().session;

  if (!session?.session_token) {
    return false;
  }

  return dayjs(session.expires_at).subtract(10, "minutes").isBefore(dayjs());
}

export function checkSessionExpiry(): {
  isExpired: boolean;
  shouldRefresh: boolean;
} {
  const session = useAuthStore.getState().session;

  if (!session?.session_token) {
    return { isExpired: false, shouldRefresh: false };
  }

  const isExpired = dayjs(session.expires_at).isBefore(dayjs());
  const shouldRefresh = shouldRefreshSession();

  if (isExpired) {
    useAuthStore.getState().clearSession();
  }

  return { isExpired, shouldRefresh };
}

export async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
  sessionToken?: string,
  retryCount = 0,
): Promise<T> {
  const MAX_RETRIES = 1;
  const tokenToUse = sessionToken ?? getCurrentSessionToken();

  if (isTokenExpired() && retryCount < MAX_RETRIES) {
    const success = await useAuthStore.getState().authenticate();
    if (success) {
      const session = useAuthStore.getState().session;
      return apiFetch(url, options, session?.session_token, retryCount + 1);
    }
  }

  const headers = {
    "Content-Type": "application/json",
    ...(tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {}),
    ...options.headers,
  };

  const baseUrl = env("NEXT_PUBLIC_API_BASE_URL");
  const fullUrl = `${baseUrl}${url}`;

  const response = await globalThis.fetch(fullUrl, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `HTTP error! status: ${response.status}, message: ${errorBody}`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const data: T = await response.json();
  return data;
}

export async function internalApiFetch<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await globalThis.fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `HTTP error! status: ${response.status}, message: ${errorBody}`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const data: T = await response.json();
  return data;
}

export function createAuthHeaders(token?: string): Record<string, string> {
  const tokenToUse = token ?? getCurrentSessionToken();
  return {
    "Content-Type": "application/json",
    ...(tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {}),
  };
}

export function buildApiUrl(endpoint: string): string {
  const baseUrl = env("NEXT_PUBLIC_API_BASE_URL");
  return `${baseUrl}${endpoint}`;
}
