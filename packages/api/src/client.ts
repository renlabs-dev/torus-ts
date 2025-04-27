import { createAuthReqData } from "@torus-network/torus-utils/auth";
import type { TRPCLink } from "@trpc/client";
import { createTRPCClient, httpBatchLink, TRPCClientError } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import SuperJSON from "superjson";
import { signData } from "./auth/sign";
import type { AppRouter } from "./root";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";

// == Auth ==
export const makeAuthenticateUserFn = (
  baseUrl: string,
  authOrigin: string,
  setStoredAuthorization: (authorization: string) => void,
  signHex: (
    msgHex: `0x${string}`,
  ) => Promise<{ signature: `0x${string}`; address: string }>,
) => {
  let isAuthenticating = false;

  return async () => {
    if (isAuthenticating) {
      console.log("Already authenticating, skipping.");
      return;
    }
    isAuthenticating = true;

    const [authReqError, authReqData] = trySync(() =>
      createAuthReqData(authOrigin),
    );
    if (authReqError !== undefined) {
      console.error("Failed to create auth request data:", authReqError);
      isAuthenticating = false;
      throw authReqError;
    }

    const [signError, signedData] = await tryAsync(
      signData(signHex, authReqData),
    );
    if (signError !== undefined) {
      console.error("Failed to sign authentication data:", signError);
      isAuthenticating = false;
      throw signError;
    }

    const authClient = createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: baseUrl + "/api/trpc",
          transformer: SuperJSON,
        }),
      ],
    });

    const [authError, result] = await tryAsync(
      authClient.auth.startSession.mutate(signedData),
    );
    if (authError !== undefined) {
      console.error("Authentication request failed:", authError);
      isAuthenticating = false;
      throw authError;
    }

    if (result.token && result.authenticationType) {
      const authorization = `${result.authenticationType} ${result.token}`;
      setStoredAuthorization(authorization);
      console.log("Authentication successful");
    } else {
      isAuthenticating = false;
      throw new Error("Invalid authentication response");
    }

    isAuthenticating = false;
  };
};

export function createAuthLink(
  authenticateUser: () => Promise<void>,
  getStoredAuthorization: () => string | null,
): TRPCLink<AppRouter> {
  return () => {
    return ({ op, next }) => {
      return observable<unknown, Error | TRPCClientError<AppRouter>>(
        (observer) => {
          let retried = false;

          const execute = () => {
            const subscription = next(op).subscribe({
              next: (result) => {
                observer.next(result);
              },
              error: (err) => {
                if (
                  !retried &&
                  err instanceof TRPCClientError &&
                  err.data?.code === "UNAUTHORIZED"
                ) {
                  retried = true;

                  void tryAsync(authenticateUser()).then(([authError, _]) => {
                    if (authError !== undefined) {
                      observer.error(authError);
                      return;
                    }

                    // Use trySync for updating headers
                    const [headerError] = trySync(() => {
                      op.context.headers = {
                        ...(op.context.headers ?? {}),
                        authorization: getStoredAuthorization() ?? "",
                      };
                    });

                    if (headerError !== undefined) {
                      observer.error(headerError);
                      return;
                    }

                    execute();
                  });
                } else {
                  observer.error(err);
                }
              },
              complete: () => {
                observer.complete();
              },
            });

            return () => {
              subscription.unsubscribe();
            };
          };

          return execute();
        },
      );
    };
  };
}
