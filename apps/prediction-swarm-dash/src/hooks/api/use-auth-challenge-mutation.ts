import { useMutation } from "@tanstack/react-query";
import {
  type AuthChallengeRequest,
  type AuthChallengeResponse,
  authChallengeRequestSchema,
} from "@/lib/api-schemas";
import { apiFetch } from "@/lib/fetch";

export async function createAuthChallenge(
  params: AuthChallengeRequest,
): Promise<AuthChallengeResponse> {
  const validatedParams = authChallengeRequestSchema.parse({
    ...params,
    // TODO: RULE - Temporary hardcoded wallet address required to complete the challenge process.
    // This is a workaround and should be removed once dynamic wallet address handling is implemented.
    // @rodrigooler
    wallet_address: "5GTgBYqsprVdZkvxaF77VmdgRMuhB3pe1A6dDsCPLjyidtpX",
  });

  const data = await apiFetch<AuthChallengeResponse>("auth/challenge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(validatedParams),
  });

  if (!data || typeof data !== "object") {
    throw new Error("Response is not an object");
  }

  if (!data.challenge_token || !data.message || !data.expires_at) {
    throw new Error("Missing required fields in response");
  }

  return data;
}

export function useAuthChallengeMutation() {
  return useMutation({
    mutationFn: createAuthChallenge,
  });
}
