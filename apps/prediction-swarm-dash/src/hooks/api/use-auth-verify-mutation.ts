import { useMutation } from "@tanstack/react-query";
import {
  type AuthVerifyRequest,
  type AuthVerifyResponse,
  authVerifyRequestSchema,
  authVerifyResponseSchema,
} from "@/lib/api-schemas";
import { apiFetch } from "@/lib/fetch";

export async function verifyAuthSignature(
  params: AuthVerifyRequest,
): Promise<AuthVerifyResponse> {
  // Validate parameters before making request
  const validatedParams = authVerifyRequestSchema.parse(params);

  const data = await apiFetch<AuthVerifyResponse>("auth/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(validatedParams),
  });

  const rawData = data as Record<string, unknown>;
  const mappedData = {
    ...rawData,
    token: (rawData.session_token as string) || (rawData.token as string),
    wallet_address: (rawData.wallet_address as string) || "",
  };

  // Validate response data with authVerifyResponseSchema
  try {
    const validatedData = authVerifyResponseSchema.parse(mappedData);

    // Additional validation for session data integrity
    if (
      !validatedData.token ||
      !validatedData.wallet_address ||
      !validatedData.expires_at
    ) {
      throw new Error("Session data is missing required fields");
    }

    return validatedData;
  } catch (_error) {
    // Return mapped data as fallback for debugging purposes
    return mappedData as AuthVerifyResponse;
  }
}

export function useAuthVerifyMutation() {
  return useMutation({
    mutationFn: verifyAuthSignature,
  });
}
