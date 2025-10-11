"use client";

import { useAuthStore } from "~/lib/auth-store";

/**
 * Simplified hook to access auth state and actions
 * Everything is now centralized in the Zustand store
 */
export function useAuth() {
  const {
    session,
    isAuthenticated,
    isAuthenticating,
    error,
    authHeaders,
    authenticate,
    clearError,
    clearSession,
  } = useAuthStore();

  return {
    session,
    isAuthenticated,
    isAuthenticating,
    error,
    authHeaders,
    authenticate,
    clearError,
    clearSession,
  };
}
