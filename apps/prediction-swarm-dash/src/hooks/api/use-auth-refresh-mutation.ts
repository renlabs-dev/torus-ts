import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "~/lib/auth-store";
import { apiFetch } from "~/lib/fetch";

async function refreshAuthSession(): Promise<{
  session_token: string;
  expires_at: number;
}> {
  const data = await apiFetch<{
    token: string;
    expires_at: string;
  }>("auth/refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (typeof data !== "object") {
    throw new Error("Response is not an object");
  }

  if (!data.token || !data.expires_at) {
    throw new Error("Missing required fields in response");
  }

  return {
    session_token: data.token,
    expires_at: new Date(data.expires_at).getTime(),
  };
}

export function useAuthRefreshMutation() {
  return useMutation({
    mutationFn: refreshAuthSession,
    onError: (error: Error) => {
      console.error("Failed to refresh session:", error);

      const session = useAuthStore.getState().session;
      if (session && new Date(session.expires_at).getTime() <= Date.now()) {
        useAuthStore.getState().clearSession();
      }
    },
  });
}
