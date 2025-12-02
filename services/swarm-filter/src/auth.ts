import { Keyring } from "@polkadot/api";
import { hexToU8a, u8aToHex } from "@polkadot/util";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { createAuthReqData } from "@torus-network/torus-utils/auth";
import type { AppRouter } from "@torus-ts/api";
import { signData } from "@torus-ts/api/auth/sign";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import SuperJSON from "superjson";

/**
 * Create a signing function from a mnemonic
 *
 * @param mnemonic - Polkadot mnemonic phrase
 * @returns Signing function compatible with tRPC auth
 */
export async function createSignerFromMnemonic(mnemonic: string) {
  await cryptoWaitReady();

  const keyring = new Keyring({ type: "sr25519" });
  const keypair = keyring.addFromUri(mnemonic);

  return async (msgHex: `0x${string}`) => {
    const message = hexToU8a(msgHex);
    const signature = keypair.sign(message);

    return {
      signature: u8aToHex(signature),
      address: keypair.address,
    };
  };
}

/**
 * Authenticate with tRPC API and get Bearer token
 *
 * @param apiUrl - Base URL of the API
 * @param authOrigin - Origin for authentication (e.g., "swarm-filter")
 * @param mnemonic - Polkadot mnemonic for signing
 * @returns Bearer token string
 */
export async function authenticateWithAPI(
  apiUrl: string,
  authOrigin: string,
  mnemonic: string,
): Promise<string> {
  // Create signer from mnemonic
  const signHex = await createSignerFromMnemonic(mnemonic);

  // Create auth request
  const authReq = createAuthReqData(authOrigin);

  // Sign the auth request
  const signedPayload = await signData(signHex, authReq);

  // Create temporary unauthenticated client for auth endpoint
  const authClient = createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${apiUrl}/api/trpc`,
        transformer: SuperJSON,
      }),
    ],
  });

  // Call startSession to get JWT token
  const result = await authClient.auth.startSession.mutate(signedPayload);

  if (!result.token || !result.authenticationType) {
    throw new Error("Authentication failed: no token received");
  }

  return `${result.authenticationType} ${result.token}`;
}

/**
 * Create authenticated tRPC client
 *
 * @param apiUrl - Base URL of the API
 * @param getAuthToken - Function to get current auth token
 * @returns Typed tRPC proxy client
 */
export function createAuthenticatedTRPCClient(
  apiUrl: string,
  getAuthToken: () => string | null,
) {
  return createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${apiUrl}/api/trpc`,
        transformer: SuperJSON,
        headers() {
          const headers: Record<string, string> = {
            "x-trpc-source": "swarm-filter",
          };

          const authToken = getAuthToken();
          if (authToken) {
            headers.authorization = authToken;
          }

          return headers;
        },
      }),
    ],
  });
}
