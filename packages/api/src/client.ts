import type { TRPCLink } from "@trpc/client";
import { TRPCClientError, createTRPCClient, httpBatchLink } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import SuperJSON from "superjson";

import { createAuthReqData } from "@torus-ts/utils/auth";

import { signData } from "./auth/sign";
import type { AppRouter } from "./root";

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

    try {
      const authReqData = createAuthReqData(authOrigin);
      const signedData = await signData(signHex, authReqData);

      const authClient = createTRPCClient<AppRouter>({
        links: [
          httpBatchLink({
            url: `${baseUrl}/api/trpc`,
            transformer: SuperJSON,
          }),
        ],
      });

      const result = await authClient.auth.startSession.mutate(signedData);

      if (result.token && result.authenticationType) {
        const authorization = `${result.authenticationType} ${result.token}`;
        setStoredAuthorization(authorization);
        console.log("Authentication successful");
      } else {
        throw new Error("Invalid authentication response");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      throw error;
    } finally {
      isAuthenticating = false;
    }
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
                  authenticateUser()
                    .then(() => {
                      op.context.headers = {
                        ...(op.context.headers ?? {}),
                        authorization: getStoredAuthorization() ?? "",
                      };
                      execute();
                    })
                    .catch((error) => {
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                      observer.error(error);
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
