import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/fetch";

interface AuthLogoutAllResponse {
  message: string;
  deleted_sessions?: number;
}

async function logoutAllAuthSessions(
  token: string,
): Promise<AuthLogoutAllResponse> {
  try {
    const data = await apiFetch<AuthLogoutAllResponse>(
      "auth/logout-all",
      {
        method: "POST",
      },
      token,
    );

    // Validate response data
    if (!data || typeof data !== "object") {
      // If response is empty or invalid, consider logout successful
      return { message: "Logout all sessions successful", deleted_sessions: 0 };
    }

    if (!data.message) {
      return { message: "Logout all sessions successful", deleted_sessions: 0 };
    }

    return data;
  } catch (error) {
    // If the error is due to empty response, consider it successful
    if (
      error instanceof Error &&
      error.message.includes("Unexpected end of JSON input")
    ) {
      return { message: "Logout all sessions successful", deleted_sessions: 0 };
    }

    // For other errors, re-throw
    throw error;
  }
}

export function useAuthLogoutAllMutation() {
  return useMutation({
    mutationFn: (token: string) => logoutAllAuthSessions(token),
  });
}
