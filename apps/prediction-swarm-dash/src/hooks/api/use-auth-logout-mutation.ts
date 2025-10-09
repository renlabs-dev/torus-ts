import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "~/lib/fetch";

interface AuthLogoutResponse {
  message: string;
}

async function logoutAuthSession(token: string): Promise<AuthLogoutResponse> {
  try {
    const data = await apiFetch<AuthLogoutResponse>(
      "auth/logout",
      {
        method: "POST",
      },
      token,
    );

    // Validate response data
    if (typeof data !== "object") {
      // If response is empty or invalid, consider logout successful
      return { message: "Logout successful" };
    }

    if (!data.message) {
      return { message: "Logout successful" };
    }

    return data;
  } catch (error) {
    // If the error is due to empty response, consider it successful
    if (
      error instanceof Error &&
      error.message.includes("Unexpected end of JSON input")
    ) {
      return { message: "Logout successful" };
    }

    // For other errors, re-throw
    throw error;
  }
}

export function useAuthLogoutMutation() {
  return useMutation({
    mutationFn: (token: string) => logoutAuthSession(token),
  });
}
