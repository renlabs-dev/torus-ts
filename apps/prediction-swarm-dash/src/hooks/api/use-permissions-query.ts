import { useQuery } from "@tanstack/react-query";
import {
  type PermissionsListParams,
  type PermissionsResponse,
  permissionsListParamsSchema,
} from "@/lib/api-schemas";
import { apiFetch } from "@/lib/fetch";

async function fetchPermissions(
  params: PermissionsListParams,
): Promise<PermissionsResponse> {
  // Validate parameters before making request
  const validatedParams = permissionsListParamsSchema.parse(params);

  const searchParams = new URLSearchParams();

  if (validatedParams.agent_address) {
    searchParams.set("agent_address", validatedParams.agent_address);
  }

  const url = `permissions/list${
    searchParams.toString() ? `?${searchParams.toString()}` : ""
  }`;

  const data = await apiFetch<PermissionsResponse>(url);

  // Validate response data structure and apply defensive programming
  try {
    // Ensure response is an array as expected by schema
    if (!Array.isArray(data)) {
      throw new Error("Response is not an array");
    }

    // Apply lenient validation strategy to prevent blocking on partial data
    const validatedResponse = data.map((item: unknown) => {
      // Type assertion for safe object access
      const permissionItem = item as Record<string, unknown>;
      return {
        ...permissionItem,
        // Apply default values for required fields to ensure data consistency
        id: (permissionItem.id as number) || 0,
        ss58_address: (permissionItem.ss58_address as string) || "unknown",
        permission: (permissionItem.permission as string) || "unknown",
        created_at:
          (permissionItem.created_at as string) || new Date().toISOString(),
      };
    });

    return validatedResponse as PermissionsResponse;
  } catch (_error) {
    throw new Error("PERMISSIONS API response does not match expected schema");
  }
}

export function usePermissionsQuery(
  params: PermissionsListParams = {},
  options: {
    enabled?: boolean;
    refetchInterval?: number;
    staleTime?: number;
  } = {},
) {
  return useQuery({
    queryKey: ["permissions", params],
    queryFn: () => fetchPermissions(params),
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchInterval ?? 30_000, // 30 seconds default
  });
}
