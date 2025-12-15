import { Keyring } from "@polkadot/keyring";
import { delegateNamespacePermission } from "@torus-network/sdk/chain";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import {
  CreditsError,
  CreditsErrorCode,
  purchaseCredits,
} from "@torus-ts/api/services/credits";
import { eq, sql } from "@torus-ts/db";
import { userCreditsSchema } from "@torus-ts/db/schema";
import { z } from "zod";
import { authPlugin } from "../middleware/auth";
import type { ContextApp } from "../middleware/context";
import { HttpError } from "../utils/errors";

const gainPermissionBodySchema = z.object({
  txData: z
    .object({
      txHash: z.string().length(66, "Transaction hash must be 66 characters"),
      blockHash: z.string().length(66, "Block hash must be 66 characters"),
    })
    .optional(),
});

export const permissionRouter = (app: ContextApp) =>
  app.use(authPlugin).post(
    "/v1/gainPermission",
    async ({
      body,
      userKey,
      db,
      wsAPI,
      env,
      permissionCache,
      appAgentName,
    }) => {
      const parsed = gainPermissionBodySchema.safeParse(body);

      if (!parsed.success) {
        throw new HttpError(400, parsed.error.message);
      }

      const { txData } = parsed.data;
      const cost = env.FILTER_PERMISSION_COST;

      // Namespace path (without agent prefix - will be added by context)
      const NAMESPACE_PATH = "prediction.filter";

      try {
        if (txData) {
          const { txHash, blockHash } = txData;

          // Validate and add credits
          await purchaseCredits(
            {
              db,
              wsAPI,
              predictionAppAddress: env.NEXT_PUBLIC_PREDICTION_APP_ADDRESS,
            },
            {
              txHash,
              blockHash,
              userKey,
            },
          );
        }

        try {
          permissionCache.checkPermission(userKey, NAMESPACE_PATH);
          throw new HttpError(
            409,
            `Permission already granted for ${NAMESPACE_PATH}`,
          );
        } catch (error) {
          if (error instanceof HttpError) {
            throw error;
          }
        }

        await db.transaction(async (tx) => {
          await tx.execute(sql`
            SELECT balance FROM user_credits
            WHERE user_key = ${userKey}
            FOR UPDATE
          `);

          const balance = await tx.query.userCreditsSchema.findFirst({
            where: eq(userCreditsSchema.userKey, userKey),
          });

          if (!balance || BigInt(balance.balance) < cost) {
            throw new HttpError(
              402,
              `Insufficient credits. Required: ${cost}, Available: ${balance?.balance ?? "0"}`,
            );
          }

          await tx
            .update(userCreditsSchema)
            .set({
              balance: sql`${userCreditsSchema.balance} - ${cost.toString()}`,
              totalSpent: sql`${userCreditsSchema.totalSpent} + ${cost.toString()}`,
              updatedAt: new Date(),
            })
            .where(eq(userCreditsSchema.userKey, userKey));

          const api = await wsAPI;
          const keyring = new Keyring({ type: "sr25519" });
          const grantor = keyring.addFromMnemonic(env.PREDICTION_APP_MNEMONIC);

          const fullNamespacePath = `agent.${appAgentName}.${NAMESPACE_PATH}`;
          const permissionTx = delegateNamespacePermission({
            api,
            recipient: userKey,
            paths: new Map([[null, [fullNamespacePath]]]),
            duration: { Indefinite: null },
            revocation: { RevocableByDelegator: null },
            instances: 1,
          });

          const [txError, _txResult] = await tryAsync<{
            txHash: string;
            blockNumber: string;
          }>(
            new Promise((resolve, reject) => {
              permissionTx
                .signAndSend(grantor, ({ status, dispatchError }) => {
                  if (dispatchError) {
                    if (dispatchError.isModule) {
                      const decoded = api.registry.findMetaError(
                        dispatchError.asModule,
                      );
                      reject(
                        new Error(
                          `${decoded.section}.${decoded.name}: ${decoded.docs.join(" ")}`,
                        ),
                      );
                    } else {
                      reject(new Error(dispatchError.toString()));
                    }
                    return;
                  }

                  if (status.isFinalized) {
                    const txHash = permissionTx.hash.toHex();
                    const blockNumber = status.asFinalized.toString();
                    resolve({ txHash, blockNumber });
                  }
                })
                .catch((err) => {
                  reject(
                    new Error(`Failed to submit transaction: ${String(err)}`),
                  );
                });
            }),
          );

          if (txError !== undefined) {
            throw new HttpError(
              500,
              `Failed to grant permission on-chain: ${txError.message}`,
            );
          }
        });

        permissionCache.addPermission(userKey, NAMESPACE_PATH);

        return { success: true };
      } catch (error) {
        if (error instanceof HttpError) {
          throw error;
        }
        if (error instanceof CreditsError) {
          if (error.code === CreditsErrorCode.DUPLICATE_TRANSACTION) {
            throw new HttpError(400, error.message);
          }
          if (error.code === CreditsErrorCode.VERIFICATION_FAILED) {
            throw new HttpError(400, error.message);
          }
          throw new HttpError(500, error.message);
        }
        throw new HttpError(500, `Internal server error: ${String(error)}`);
      }
    },
    {
      body: gainPermissionBodySchema,
      detail: {
        tags: ["permissions"],
        summary: "Gain filter permission",
        description:
          "Purchase permanent filtering permission using credits. Optionally provide transaction data to add credits before charging.",
      },
    },
  );
