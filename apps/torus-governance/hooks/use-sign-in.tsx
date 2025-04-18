"use client";

import { createAuthReqData } from "@torus-network/torus-utils/auth";
import { useTorus } from "@torus-ts/torus-provider";
import { env } from "~/env";
import { api } from "~/trpc/react";
import { useSearchParams } from "next/navigation";
import { signData } from "node_modules/@torus-ts/api/src/auth/sign";
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

    checkSession
      .mutateAsync({ auth })
      .then((data) => {
        setIsUserAuthenticated(data.isValid);
        if (!data.isValid) {
          localStorage.removeItem("authorization");
        }
      })
      .catch((error) => {
        console.error("Session check error:", error);
        localStorage.removeItem("authorization");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  useEffect(() => {
    const favoriteWalletAddress = localStorage.getItem("favoriteWalletAddress");
    if (!selectedAccount || favoriteWalletAddress === selectedAccount.address)
      return;

    setIsUserAuthenticated(null);
    localStorage.removeItem("authorization");
  }, [selectedAccount]);

  const startSessionMutation = api.auth.startSession.useMutation();

  const authenticateUser = async () => {
    try {
      const authReqData = createAuthReqData(
        String(env("NEXT_PUBLIC_AUTH_ORIGIN")),
      );
      const signedData = await signData(signHex, authReqData);
      const startSessionData =
        await startSessionMutation.mutateAsync(signedData);

      if (startSessionData.token && startSessionData.authenticationType) {
        const newAuthorization = `${startSessionData.authenticationType} ${startSessionData.token}`;
        localStorage.setItem("authorization", newAuthorization);
        setIsUserAuthenticated(true);
      } else {
        throw new Error("Invalid authentication response");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      throw error;
    }
  };

  return {
    isUserAuthenticated,
    authenticateUser,
  };
};
