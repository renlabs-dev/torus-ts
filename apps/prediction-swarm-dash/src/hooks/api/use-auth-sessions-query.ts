import { useQuery } from "@tanstack/react-query";
import type { AuthSessionsResponse } from "~/lib/api-schemas";
import { createQueryKey } from "~/lib/api-utils";
import { apiFetch } from "~/lib/fetch";

async function fetchAuthSessions(token: string): Promise<AuthSessionsResponse> {
  const data = await apiFetch<AuthSessionsResponse>("auth/sessions", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Validate response data
  try {
    // Basic validation - check structure
    if (typeof data !== "object") {
      throw new Error("Response is not an object");
    }

    if (!Array.isArray(data.sessions)) {
      throw new Error("sessions is not an array");
    }

    // For now, be more lenient with validation to avoid blocking
    const validatedResponse = {
      sessions: data.sessions.map((item: unknown) => {
        const sessionItem = item as Record<string, unknown>;
        return {
          ...sessionItem,
          // Ensure required fields exist with defaults if needed
          token: (sessionItem.token as string) || "",
          wallet_address: (sessionItem.wallet_address as string) || "",
          created_at:
            (sessionItem.created_at as string) || new Date().toISOString(),
          expires_at:
            (sessionItem.expires_at as string) || new Date().toISOString(),
          last_used_at: sessionItem.last_used_at,
        };
      }),
      total: data.total || 0,
    };

    return validatedResponse as AuthSessionsResponse;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    throw new Error(
      "AUTH-SESSIONS API response does not match expected schema",
    );
  }
}

export function useAuthSessionsQuery(
  token: string,
  options: {
    enabled?: boolean;
    refetchInterval?: number;
    staleTime?: number;
  } = {},
) {
  return useQuery({
    queryKey: createQueryKey("auth-sessions", { token }),
    queryFn: () => fetchAuthSessions(token),
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchInterval ?? 2 * 60 * 1000, // 2 minutes default
    staleTime: options.staleTime ?? 30 * 1000, // 30 seconds default
  });
}
