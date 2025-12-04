import { BasicLogger } from "@torus-network/torus-utils/logger";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { validateEnvOrExit } from "@torus-network/torus-utils/env";
import { withExponentialBackoff } from "@torus-network/torus-utils";
import { z } from "zod";
import { ApiPromise, WsProvider } from "@polkadot/api";
import type { ISubmittableResult } from "@polkadot/types/types";
import { Keyring } from "@polkadot/keyring";
import {
  updateStreamPermission,
  executePermission,
  queryPermission,
  queryAccumulatedStreamAmount,
} from "@torus-network/sdk/chain";
import type { SS58Address } from "@torus-network/sdk/types";
import { calculateContributorScores } from "./services/contributor-scoring.js";
import { saveDistribution } from "./services/reward-distribution.js";
import { notifyDistributionComplete } from "./services/discord-webhook.js";
import { getLastDistributionTimeForPermission } from "./db.js";

const log = BasicLogger.create({ name: "swarm-services" });

export const env = validateEnvOrExit({
  SWARM_EVALUATION_PERIOD_HOURS: z.coerce.number().default(168),
  SWARM_MIN_PRECISION_THRESHOLD: z.coerce.number().default(5),
  SWARM_REDUNDANCY_PENALTY_THRESHOLD: z.coerce.number().default(4),
  SWARM_DISTRIBUTION_INTERVAL_HOURS: z.coerce.number().default(24),
  SWARM_DISCORD_WEBHOOK_URL: z.string(),
  SWARM_PERMISSION_ID: z.custom<`0x${string}`>(
    (val) =>
      typeof val === "string" && val.length === 66 && val.startsWith("0x"),
  ),
  NEXT_PUBLIC_TORUS_RPC_URL: z.string().url(),
  PREDICTION_APP_MNEMONIC: z.string(),
})(process.env);

async function runDistribution() {
  const lastDistribution = await getLastDistributionTimeForPermission(
    env.SWARM_PERMISSION_ID,
  );

  const periodStart = lastDistribution ?? new Date("2025-01-18T00:00:00Z");

  log.info("Running distribution", { periodStart, lastDistribution });

  const [scoresErr, scores] = await tryAsync(
    calculateContributorScores(
      periodStart,
      env.SWARM_MIN_PRECISION_THRESHOLD / 100,
      env.SWARM_REDUNDANCY_PENALTY_THRESHOLD,
    ),
  );

  if (scoresErr) {
    log.error("Failed to calculate scores", { error: scoresErr });
    throw scoresErr;
  }

  log.info("Scores calculated", { recipients: scores.size });

  log.info("Connecting to blockchain", {
    rpcUrl: env.NEXT_PUBLIC_TORUS_RPC_URL,
  });

  const provider = new WsProvider(env.NEXT_PUBLIC_TORUS_RPC_URL);
  const [apiErr, api] = await tryAsync(ApiPromise.create({ provider }));

  if (apiErr) {
    log.error("Failed to connect to blockchain", { error: apiErr });
    throw apiErr;
  }

  try {
    const [permErr, permission] = await queryPermission(
      api,
      env.SWARM_PERMISSION_ID,
    );

    if (permErr !== undefined) {
      log.error("Failed to query permission", { error: permErr });
      throw permErr;
    }

    if (permission === null) {
      throw new Error(`Permission ${env.SWARM_PERMISSION_ID} not found`);
    }

    if (!("Stream" in permission.scope)) {
      throw new Error("Permission is not a Stream permission");
    }

    const streamScope = permission.scope.Stream;
    if (!("Streams" in streamScope.allocation)) {
      throw new Error("Permission does not have Streams allocation");
    }

    const streams = streamScope.allocation.Streams;
    log.info("Found streams", { count: streams.size });

    let totalAccumulated = BigInt(0);
    for (const [streamId] of streams) {
      const [accErr, accumulated] = await queryAccumulatedStreamAmount(
        api,
        permission.delegator,
        streamId,
        env.SWARM_PERMISSION_ID,
      );

      if (accErr !== undefined) {
        log.error("Failed to query accumulated amount", {
          streamId,
          error: accErr,
        });
        throw accErr;
      }

      totalAccumulated += accumulated;
    }

    log.info("Total accumulated", { amount: totalAccumulated.toString() });

    if (totalAccumulated === BigInt(0)) {
      log.info("No accumulated amount, skipping distribution");

      const [saveErr] = await tryAsync(
        saveDistribution(new Map(), env.SWARM_PERMISSION_ID),
      );

      if (saveErr) {
        log.error("Failed to save skipped distribution", { error: saveErr });
      } else {
        log.info("Skipped distribution saved");
      }

      await api.disconnect();
      return;
    }

    const currentRecipients = new Set(streamScope.recipients.keys());
    const recipients: [SS58Address, number][] = Array.from(
      scores.entries(),
    ).filter(([address]) => currentRecipients.has(address));

    if (recipients.length === 0) {
      log.info("No valid recipients after filtering, skipping");
      await api.disconnect();
      return;
    }

    const keyring = new Keyring({ type: "sr25519" });
    const signer = keyring.addFromMnemonic(env.PREDICTION_APP_MNEMONIC);

    log.info("Updating recipients", { count: recipients.length });
    const updateTx = updateStreamPermission({
      api,
      permissionId: env.SWARM_PERMISSION_ID,
      newRecipients: recipients,
    });

    const [updateErr] = await tryAsync(
      new Promise<void>((resolve, reject) => {
        updateTx
          .signAndSend(
            signer,
            ({ status, dispatchError }: ISubmittableResult) => {
              if (status.isInBlock) {
                log.info("Update included in block", {
                  blockHash: status.asInBlock.toString(),
                });
              }

              if (status.isFinalized) {
                if (dispatchError) {
                  if (dispatchError.isModule) {
                    const decoded = api.registry.findMetaError(
                      dispatchError.asModule,
                    );
                    const docs = Array.isArray(decoded.docs)
                      ? decoded.docs.join(" ")
                      : decoded.docs;
                    reject(
                      new Error(`${decoded.section}.${decoded.name}: ${docs}`),
                    );
                  } else {
                    reject(new Error(dispatchError.toString()));
                  }
                } else {
                  log.info("Update finalized", {
                    blockHash: status.asFinalized.toString(),
                  });
                  resolve();
                }
              }
            },
          )
          .catch(reject);
      }),
    );

    if (updateErr) {
      log.error("Failed to update permission", { error: updateErr });
      throw updateErr;
    }

    log.info("Recipients updated");

    const [webhookErr] = await tryAsync(
      notifyDistributionComplete(env.SWARM_DISCORD_WEBHOOK_URL, scores),
    );

    if (webhookErr) {
      log.error("Discord notification failed", { error: webhookErr });
    } else {
      log.info("Discord notification sent");
    }

    log.info("Executing permission");

    const executeTx = executePermission(api, env.SWARM_PERMISSION_ID);

    const [executeErr] = await tryAsync(
      new Promise<void>((resolve, reject) => {
        executeTx
          .signAndSend(
            signer,
            ({ status, dispatchError }: ISubmittableResult) => {
              if (status.isInBlock) {
                log.info("Execution included in block", {
                  blockHash: status.asInBlock.toString(),
                });
              }

              if (status.isFinalized) {
                if (dispatchError) {
                  if (dispatchError.isModule) {
                    const decoded = api.registry.findMetaError(
                      dispatchError.asModule,
                    );
                    const docs = Array.isArray(decoded.docs)
                      ? decoded.docs.join(" ")
                      : decoded.docs;
                    reject(
                      new Error(`${decoded.section}.${decoded.name}: ${docs}`),
                    );
                  } else {
                    reject(new Error(dispatchError.toString()));
                  }
                } else {
                  log.info("Execution finalized", {
                    blockHash: status.asFinalized.toString(),
                  });
                  resolve();
                }
              }
            },
          )
          .catch(reject);
      }),
    );

    if (executeErr) {
      log.error("Failed to execute permission", { error: executeErr });
      throw executeErr;
    }

    log.info("Permission executed");

    const [saveErr] = await tryAsync(
      saveDistribution(scores, env.SWARM_PERMISSION_ID),
    );

    if (saveErr) {
      log.error("Failed to save distribution", { error: saveErr });
      throw saveErr;
    }

    log.info("Distribution saved");
  } finally {
    await api.disconnect();
  }
}

async function runDistributionService() {
  const intervalMs = env.SWARM_DISTRIBUTION_INTERVAL_HOURS * 60 * 60 * 1000;
  const withBackoff = withExponentialBackoff(1000, 5);

  log.info("Starting distribution service", {
    intervalHours: env.SWARM_DISTRIBUTION_INTERVAL_HOURS,
  });

  while (true) {
    await withBackoff(async (attempt) => {
      if (attempt > 0) {
        log.info("Retrying", { attempt });
      }

      const lastDistribution = await getLastDistributionTimeForPermission(
        env.SWARM_PERMISSION_ID,
      );

      const now = new Date();
      let shouldRun = false;
      let nextRunTime: Date;

      if (lastDistribution === null) {
        log.info("No previous distribution, running now");
        shouldRun = true;
        nextRunTime = now;
      } else {
        nextRunTime = new Date(lastDistribution.getTime() + intervalMs);

        if (now >= nextRunTime) {
          log.info("Interval elapsed, running now");
          shouldRun = true;
        } else {
          const waitMinutes = Math.round(
            (nextRunTime.getTime() - now.getTime()) / 1000 / 60,
          );
          log.info("Not yet due", { waitMinutes, nextRunTime });
        }
      }

      if (shouldRun) {
        await runDistribution();
        log.info("Distribution completed");
      } else {
        const sleepTime = nextRunTime.getTime() - Date.now();
        const sleepMinutes = Math.round(sleepTime / 1000 / 60);
        log.info("Sleeping until next distribution", {
          minutes: sleepMinutes,
          nextRun: new Date(Date.now() + sleepTime),
        });
        await new Promise((resolve) => setTimeout(resolve, sleepTime));
      }
    }).catch((error: unknown) => {
      log.error("Error in loop, retrying with backoff", { error });
    });
  }
}

async function main() {
  const serviceType = process.argv[2];

  if (!serviceType) {
    console.error("ERROR: You must provide the service type as an argument.");
    console.error("Available services: distribution");
    process.exit(1);
  }

  switch (serviceType) {
    case "distribution":
      await runDistributionService();
      break;
    default:
      console.error(`ERROR: Unknown service type '${serviceType}'.`);
      console.error("Available services: distribution");
      process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
