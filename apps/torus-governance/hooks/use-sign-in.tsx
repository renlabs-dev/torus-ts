"use client";

import { createAuthReqData } from "@torus-network/torus-utils/auth";
import { useTorus } from "@torus-ts/torus-provider";
import { env } from "~/env";
import { api } from "~/trpc/react";
import { useSearchParams } from "next/navigation";
import { signData } from "node_modules/@torus-ts/api/src/auth/sign";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { useEffect, useState } from "react";

export const useSignIn = () => {
  const { signHex, selectedAccount } = useTorus();

  const [isUserAuthenticated, setIsUserAuthenticated] = useState<
    boolean | null
  >(null);

  const checkSession = api.auth.checkSession.useMutation();

  const searchParams = useSearchParams();
  const viewMode = searchParams.get("view");

  useEffect(() => {
    if (!(viewMode === "dao-portal")) return;

    const auth = localStorage.getItem("authorization");
    if (!auth) {
      setIsUserAuthenticated(false);
      return;
    }

    // Async function for session checking with proper error handling
    async function checkUserSession() {
      if (!auth) return;
      const [error, data] = await tryAsync(checkSession.mutateAsync({ auth }));

      if (error !== undefined) {
        console.error("Session check error:", error);
        const [storageError] = await tryAsync(
          Promise.resolve(localStorage.removeItem("authorization")),
        );
        if (storageError !== undefined) {
          console.error("Error removing from localStorage:", storageError);
        }
        setIsUserAuthenticated(false);
        return;
      }

      setIsUserAuthenticated(data.isValid);
      if (!data.isValid) {
        const [storageError] = await tryAsync(
          Promise.resolve(localStorage.removeItem("authorization")),
        );
        if (storageError !== undefined) {
          console.error("Error removing from localStorage:", storageError);
        }
      }
    }

    void checkUserSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  useEffect(() => {
    const favoriteWalletAddress = localStorage.getItem("favoriteWalletAddress");
    if (!selectedAccount || favoriteWalletAddress === selectedAccount.address)
      return;

    setIsUserAuthenticated(null);

    // Handle localStorage with proper error handling
    const clearStorage = async () => {
      const [storageError] = await tryAsync(
        Promise.resolve(localStorage.removeItem("authorization")),
      );
      if (storageError !== undefined) {
        console.error("Error removing from localStorage:", storageError);
      }
    };

    void clearStorage();
  }, [selectedAccount]);

  const startSessionMutation = api.auth.startSession.useMutation();

  const authenticateUser = async () => {
    // Generate auth request data
    const authReqData = createAuthReqData(
      String(env("NEXT_PUBLIC_AUTH_ORIGIN")),
    );

    // Sign the data
    const [signError, signedData] = await tryAsync(
      signData(signHex, authReqData),
    );
    if (signError !== undefined) {
      console.error("Error signing data:", signError);
      throw new Error("Failed to sign authentication data");
    }

    // Start session with signed data
    const [sessionError, startSessionData] = await tryAsync(
      startSessionMutation.mutateAsync(signedData),
    );

    if (sessionError !== undefined) {
      console.error("Error starting session:", sessionError);
      throw new Error("Failed to authenticate with server");
    }

    // Validate session data
    if (!startSessionData.token || !startSessionData.authenticationType) {
      throw new Error("Invalid authentication response");
    }

    // Store authentication token
    const newAuthorization = `${startSessionData.authenticationType} ${startSessionData.token}`;
    const [storageError] = await tryAsync(
      Promise.resolve(localStorage.setItem("authorization", newAuthorization)),
    );

    if (storageError !== undefined) {
      console.error("Error saving to localStorage:", storageError);
      throw new Error("Failed to save authentication token");
    }

    setIsUserAuthenticated(true);
  };

  return {
    isUserAuthenticated,
    authenticateUser,
  };
};
