import { useQuery } from "@tanstack/react-query";
import type { AuthVerifyResponse } from "@/lib/api-schemas";
import { createQueryKey } from "@/lib/api-utils";
import { apiFetch } from "@/lib/fetch";

async function validateAuthSession(token: string): Promise<AuthVerifyResponse> {
  const data = await apiFetch<AuthVerifyResponse>("auth/verify", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Validate response data structure and type integrity
  try {
    // Ensure response is a valid object before processing
    if (!data || typeof data !== "object") {
      throw new Error("Response is not an object");
    }

    return data;
  } catch (_error) {
    throw new Error(
      "AUTH-VERIFY-SESSION API response does not match expected schema",
    );
  }
}

export function useAuthVerifyQuery(
  token: string,
  options: {
    enabled?: boolean;
    refetchInterval?: number;
    staleTime?: number;
  } = {},
) {
  return useQuery({
    queryKey: createQueryKey("auth-verify", { token }),
    queryFn: () => validateAuthSession(token),
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchInterval ?? 5 * 60 * 1000, // 5 minutes default
    staleTime: options.staleTime ?? 2 * 60 * 1000, // 2 minutes default
  });
}
