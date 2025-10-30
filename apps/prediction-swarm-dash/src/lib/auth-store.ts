import { env } from "~/env";
import { createAuthChallenge } from "~/hooks/api/use-auth-challenge-mutation";
import { verifyAuthSignature } from "~/hooks/api/use-auth-verify-mutation";
import { signMessageAPI } from "~/hooks/api/use-sign-message";
import dayjs from "dayjs";
import { create } from "zustand";

interface AuthSession {
  session_token: string;
  expires_at: string;
}

interface AuthState {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  error: string | null;
  authHeaders: Record<string, string>;
  isInitialized: boolean;

  // Actions
  setSession: (session: AuthSession | null) => void;
  setAuthenticating: (isAuthenticating: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  clearSession: () => void;
  initializeFromStorage: () => void;
  authenticate: () => Promise<boolean>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  isAuthenticated: false,
  isAuthenticating: false,
  error: null,
  authHeaders: {},
  isInitialized: false,

  setSession: (session: AuthSession | null) => {
    if (!session) {
      localStorage.removeItem("torusDashboardSession");
      set({
        session: null,
        isAuthenticated: false,
        authHeaders: {},
      });
      return;
    }

    if (dayjs(session.expires_at).isBefore(dayjs())) {
      localStorage.removeItem("torusDashboardSession");
      set({
        session: null,
        isAuthenticated: false,
        authHeaders: {},
      });
      return;
    }

    const sessionString = JSON.stringify(session);
    localStorage.setItem("torusDashboardSession", sessionString);

    set({
      session,
      isAuthenticated: true,
      authHeaders: { Authorization: `Bearer ${session.session_token}` },
    });
  },

  setAuthenticating: (isAuthenticating: boolean) => set({ isAuthenticating }),

  setError: (error: string | null) => set({ error }),

  clearError: () => set({ error: null }),

  clearSession: () => {
    localStorage.removeItem("torusDashboardSession");
    set({
      session: null,
      isAuthenticated: false,
      authHeaders: {},
    });
  },

  initializeFromStorage: () => {
    try {
      const savedSession = localStorage.getItem("torusDashboardSession");
      if (!savedSession) {
        set({
          session: null,
          isAuthenticated: false,
          authHeaders: {},
        });
        return;
      }

      const parsedSession = JSON.parse(savedSession) as unknown;

      if (
        !parsedSession ||
        typeof parsedSession !== "object" ||
        !("session_token" in parsedSession) ||
        typeof parsedSession.session_token !== "string" ||
        parsedSession.session_token.length === 0
      ) {
        throw new Error("Invalid session_token");
      }

      if (
        !("expires_at" in parsedSession) ||
        typeof parsedSession.expires_at !== "string" ||
        dayjs(parsedSession.expires_at).isBefore(dayjs())
      ) {
        throw new Error("Session expired or invalid expires_at");
      }

      const session: AuthSession = {
        session_token: parsedSession.session_token,
        expires_at: parsedSession.expires_at,
      };

      set({
        session,
        isAuthenticated: true,
        authHeaders: {
          Authorization: `Bearer ${session.session_token}`,
        },
      });
    } catch (error) {
      console.error("Failed to restore session from localStorage:", error);
      localStorage.removeItem("torusDashboardSession");
      set({
        session: null,
        isAuthenticated: false,
        authHeaders: {},
      });
    }
  },

  authenticate: async () => {
    const state = get();

    set({ isAuthenticating: true, error: null });

    try {
      const challenge = await createAuthChallenge({
        wallet_address: env("NEXT_PUBLIC_DEFAULT_WALLET_ADDRESS"),
      });

      const signatureResult = await signMessageAPI({
        message: challenge.message,
      });

      const { signature: fullSignature } = signatureResult;
      const signature = fullSignature.startsWith("0x")
        ? fullSignature.slice(2)
        : fullSignature;

      const sessionData = await verifyAuthSignature({
        challenge_token: challenge.challenge_token,
        signature: signature,
      });

      if (!sessionData.token || !sessionData.expires_at) {
        throw new Error("Invalid session data received from server");
      }

      const session = {
        session_token: sessionData.token,
        expires_at: sessionData.expires_at,
      };

      state.setSession(session);
      set({ isAuthenticating: false });

      return true;
    } catch (error) {
      set({ isAuthenticating: false });

      if (error instanceof Error) {
        set({ error: error.message });
      } else {
        set({ error: "Authentication failed" });
      }
      return false;
    }
  },

  initializeAuth: async () => {
    const state = get();

    if (state.isInitialized) return;

    set({ isInitialized: true });

    state.initializeFromStorage();
    await new Promise((resolve) => setTimeout(resolve, 50));

    const currentState = get();

    if (currentState.isAuthenticated && currentState.session) {
      const shouldRefresh = dayjs(currentState.session.expires_at)
        .subtract(10, "minutes")
        .isBefore(dayjs());

      if (!shouldRefresh) {
        return;
      }

      console.log("Session expires soon, refreshing...");
      await currentState.authenticate();
      return;
    }

    if (currentState.isAuthenticating) {
      return;
    }

    await currentState.authenticate();
  },
}));
