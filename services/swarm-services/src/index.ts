import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
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
import { createDb } from "@torus-ts/db/client";
import {
  calculateContributorScores,
  calculateVerifierContributorScores,
} from "./services/contributor-scoring.js";
import { saveDistribution } from "./services/reward-distribution.js";
import { notifyDistributionComplete } from "./services/discord-webhook.js";
import { getLastDistributionTimeForPermission } from "./db.js";
import { PredictionJudge } from "./services/prediction-judge.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const log = BasicLogger.create({ name: "swarm-services" });

export const env = validateEnvOrExit({
  SWARM_EVALUATION_PERIOD_HOURS: z.coerce.number().default(168),
  SWARM_MIN_PRECISION_THRESHOLD: z.coerce.number().default(5),
  SWARM_REDUNDANCY_PENALTY_THRESHOLD: z.coerce.number().default(4),
  SWARM_DISTRIBUTION_INTERVAL_HOURS: z.coerce.number().default(24),
  SWARM_DISCORD_WEBHOOK_URL: z.string().optional(),
  SWARM_PERMISSION_ID: z
    .custom<`0x${string}`>((val) => typeof val === "string" && val.length === 66 && val.startsWith("0x"))
    .optional(),
  SWARM_VERIFIER_PERMISSION_ID: z
    .custom<`0x${string}`>((val) => typeof val === "string" && val.length === 66 && val.startsWith("0x"))
    .optional(),
  SWARM_TRUSTED_VERIFIER_AGENT_ID: z.string().optional(),
  NEXT_PUBLIC_TORUS_RPC_URL: z.string().url().optional(),
  PREDICTION_APP_MNEMONIC: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  FIRECRAWL_API_KEY: z.string().optional(),
  JUDGE_CONCURRENCY: z.coerce.number().default(8),
})(process.env);

async function runDistribution() {
  if (!env.SWARM_PERMISSION_ID) {
    throw new Error("SWARM_PERMISSION_ID is required for distribution");
  }
  if (!env.SWARM_TRUSTED_VERIFIER_AGENT_ID) {
    throw new Error(
      "SWARM_TRUSTED_VERIFIER_AGENT_ID is required for distribution",
    );
  }
  if (!env.NEXT_PUBLIC_TORUS_RPC_URL) {
    throw new Error("NEXT_PUBLIC_TORUS_RPC_URL is required for distribution");
  }
  if (!env.PREDICTION_APP_MNEMONIC) {
    throw new Error("PREDICTION_APP_MNEMONIC is required for distribution");
  }
  if (!env.SWARM_DISCORD_WEBHOOK_URL) {
    throw new Error("SWARM_DISCORD_WEBHOOK_URL is required for distribution");
  }

  const permissionId = env.SWARM_PERMISSION_ID;
  const trustedVerifierAgentId = env.SWARM_TRUSTED_VERIFIER_AGENT_ID;
  const rpcUrl = env.NEXT_PUBLIC_TORUS_RPC_URL;
  const mnemonic = env.PREDICTION_APP_MNEMONIC;
  const webhookUrl = env.SWARM_DISCORD_WEBHOOK_URL;

  const lastDistribution =
    await getLastDistributionTimeForPermission(permissionId);

  const periodStart = lastDistribution ?? new Date("2025-01-18T00:00:00Z");

  log.info("Running distribution", { periodStart, lastDistribution });

  const [scoresErr, scores] = await tryAsync(
    calculateContributorScores(
      periodStart,
      trustedVerifierAgentId,
      env.SWARM_MIN_PRECISION_THRESHOLD / 100,
      env.SWARM_REDUNDANCY_PENALTY_THRESHOLD,
    ),
  );

  if (scoresErr) {
    log.error("Failed to calculate scores", { error: scoresErr });
    throw scoresErr;
  }

  log.info("Scores calculated", { recipients: scores.size });

  log.info("Connecting to blockchain", { rpcUrl });

  const provider = new WsProvider(rpcUrl);
  const [apiErr, api] = await tryAsync(ApiPromise.create({ provider }));

  if (apiErr) {
    log.error("Failed to connect to blockchain", { error: apiErr });
    throw apiErr;
  }

  try {
    const [permErr, permission] = await queryPermission(api, permissionId);

    if (permErr !== undefined) {
      log.error("Failed to query permission", { error: permErr });
      throw permErr;
    }

    if (permission === null) {
      throw new Error(`Permission ${permissionId} not found`);
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
        permissionId,
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
        saveDistribution(new Map(), permissionId),
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
    const signer = keyring.addFromMnemonic(mnemonic);

    log.info("Updating recipients", { count: recipients.length });
    const updateTx = updateStreamPermission({
      api,
      permissionId,
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
      notifyDistributionComplete(webhookUrl, scores),
    );

    if (webhookErr) {
      log.error("Discord notification failed", { error: webhookErr });
    } else {
      log.info("Discord notification sent");
    }

    log.info("Executing permission");

    const executeTx = executePermission(api, permissionId);

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

    const [saveErr] = await tryAsync(saveDistribution(scores, permissionId));

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
  if (!env.SWARM_PERMISSION_ID) {
    throw new Error("SWARM_PERMISSION_ID is required for distribution");
  }
  const permissionId = env.SWARM_PERMISSION_ID;

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

      const lastDistribution =
        await getLastDistributionTimeForPermission(permissionId);

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

async function runVerifierDistribution() {
  if (!env.SWARM_VERIFIER_PERMISSION_ID) {
    throw new Error("SWARM_VERIFIER_PERMISSION_ID is not set");
  }
  if (!env.NEXT_PUBLIC_TORUS_RPC_URL) {
    throw new Error("NEXT_PUBLIC_TORUS_RPC_URL is required");
  }
  if (!env.PREDICTION_APP_MNEMONIC) {
    throw new Error("PREDICTION_APP_MNEMONIC is required");
  }
  if (!env.SWARM_DISCORD_WEBHOOK_URL) {
    throw new Error("SWARM_DISCORD_WEBHOOK_URL is required");
  }

  const verifierPermissionId = env.SWARM_VERIFIER_PERMISSION_ID;
  const rpcUrl = env.NEXT_PUBLIC_TORUS_RPC_URL;
  const mnemonic = env.PREDICTION_APP_MNEMONIC;
  const webhookUrl = env.SWARM_DISCORD_WEBHOOK_URL;

  const lastDistribution =
    await getLastDistributionTimeForPermission(verifierPermissionId);

  const periodStart = lastDistribution ?? new Date("2025-01-18T00:00:00Z");

  log.info("Running verifier distribution", { periodStart, lastDistribution });

  const [scoresErr, scores] = await tryAsync(
    calculateVerifierContributorScores(
      periodStart,
      env.SWARM_MIN_PRECISION_THRESHOLD / 100,
      env.SWARM_REDUNDANCY_PENALTY_THRESHOLD,
    ),
  );

  if (scoresErr) {
    log.error("Failed to calculate verifier scores", { error: scoresErr });
    throw scoresErr;
  }

  log.info("Verifier scores calculated", { recipients: scores.size });

  log.info("Connecting to blockchain", { rpcUrl });

  const provider = new WsProvider(rpcUrl);
  const [apiErr, api] = await tryAsync(ApiPromise.create({ provider }));

  if (apiErr) {
    log.error("Failed to connect to blockchain", { error: apiErr });
    throw apiErr;
  }

  try {
    const [permErr, permission] = await queryPermission(
      api,
      verifierPermissionId,
    );

    if (permErr !== undefined) {
      log.error("Failed to query permission", { error: permErr });
      throw permErr;
    }

    if (permission === null) {
      throw new Error(`Permission ${verifierPermissionId} not found`);
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
        verifierPermissionId,
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

    log.info("Total accumulated for verifiers", {
      amount: totalAccumulated.toString(),
    });

    if (totalAccumulated === BigInt(0)) {
      log.info("No accumulated amount, skipping verifier distribution");

      const [saveErr] = await tryAsync(
        saveDistribution(new Map(), verifierPermissionId),
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
      log.info("No valid verifier recipients after filtering, skipping");
      await api.disconnect();
      return;
    }

    const keyring = new Keyring({ type: "sr25519" });
    const signer = keyring.addFromMnemonic(mnemonic);

    log.info("Updating verifier recipients", { count: recipients.length });
    const updateTx = updateStreamPermission({
      api,
      permissionId: verifierPermissionId,
      newRecipients: recipients,
    });

    const [updateErr] = await tryAsync(
      new Promise<void>((resolve, reject) => {
        updateTx
          .signAndSend(
            signer,
            ({ status, dispatchError }: ISubmittableResult) => {
              if (status.isInBlock) {
                log.info("Verifier update included in block", {
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
                  log.info("Verifier update finalized", {
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
      log.error("Failed to update verifier permission", { error: updateErr });
      throw updateErr;
    }

    log.info("Verifier recipients updated");

    const [webhookErr] = await tryAsync(
      notifyDistributionComplete(webhookUrl, scores),
    );

    if (webhookErr) {
      log.error("Discord notification failed", { error: webhookErr });
    } else {
      log.info("Discord notification sent for verifier distribution");
    }

    log.info("Executing verifier permission");

    const executeTx = executePermission(api, verifierPermissionId);

    const [executeErr] = await tryAsync(
      new Promise<void>((resolve, reject) => {
        executeTx
          .signAndSend(
            signer,
            ({ status, dispatchError }: ISubmittableResult) => {
              if (status.isInBlock) {
                log.info("Verifier execution included in block", {
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
                  log.info("Verifier execution finalized", {
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
      log.error("Failed to execute verifier permission", { error: executeErr });
      throw executeErr;
    }

    log.info("Verifier permission executed");

    const [saveErr] = await tryAsync(
      saveDistribution(scores, verifierPermissionId),
    );

    if (saveErr) {
      log.error("Failed to save verifier distribution", { error: saveErr });
      throw saveErr;
    }

    log.info("Verifier distribution saved");
  } finally {
    await api.disconnect();
  }
}

async function runVerifierDistributionService() {
  const intervalMs = env.SWARM_DISTRIBUTION_INTERVAL_HOURS * 60 * 60 * 1000;
  const withBackoff = withExponentialBackoff(1000, 5);

  if (!env.SWARM_VERIFIER_PERMISSION_ID) {
    throw new Error(
      "SWARM_VERIFIER_PERMISSION_ID is required for verifier distribution",
    );
  }

  const verifierPermissionId = env.SWARM_VERIFIER_PERMISSION_ID;

  log.info("Starting verifier distribution service", {
    intervalHours: env.SWARM_DISTRIBUTION_INTERVAL_HOURS,
  });

  while (true) {
    await withBackoff(async (attempt) => {
      if (attempt > 0) {
        log.info("Retrying verifier distribution", { attempt });
      }

      const lastDistribution =
        await getLastDistributionTimeForPermission(verifierPermissionId);

      const now = new Date();
      let shouldRun = false;
      let nextRunTime: Date;

      if (lastDistribution === null) {
        log.info("No previous verifier distribution, running now");
        shouldRun = true;
        nextRunTime = now;
      } else {
        nextRunTime = new Date(lastDistribution.getTime() + intervalMs);

        if (now >= nextRunTime) {
          log.info("Interval elapsed for verifier distribution, running now");
          shouldRun = true;
        } else {
          const waitMinutes = Math.round(
            (nextRunTime.getTime() - now.getTime()) / 1000 / 60,
          );
          log.info("Verifier distribution not yet due", {
            waitMinutes,
            nextRunTime,
          });
        }
      }

      if (shouldRun) {
        await runVerifierDistribution();
        log.info("Verifier distribution completed");
      } else {
        const sleepTime = nextRunTime.getTime() - Date.now();
        const sleepMinutes = Math.round(sleepTime / 1000 / 60);
        log.info("Sleeping until next verifier distribution", {
          minutes: sleepMinutes,
          nextRun: new Date(Date.now() + sleepTime),
        });
        await new Promise((resolve) => setTimeout(resolve, sleepTime));
      }
    }).catch((error: unknown) => {
      log.error("Error in verifier distribution loop, retrying with backoff", {
        error,
      });
    });
  }
}

async function runJudgeService() {
  if (!env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is required for judge service");
  }
  if (!env.FIRECRAWL_API_KEY) {
    throw new Error("FIRECRAWL_API_KEY is required for judge service");
  }

  const sourceValidationPrompt = await readFile(
    join(__dirname, "../SOURCE_VALIDATION_PROMPT.md"),
    "utf-8",
  );

  const judge = new PredictionJudge(
    {
      openrouterApiKey: env.OPENROUTER_API_KEY,
      firecrawlApiKey: env.FIRECRAWL_API_KEY,
      concurrency: env.JUDGE_CONCURRENCY,
      sourceValidationPrompt,
    },
    createDb(),
  );

  log.info("Starting judge service", { concurrency: env.JUDGE_CONCURRENCY });
  await judge.runJudge(() => false);
}

async function main() {
  const serviceType = process.argv[2];

  if (!serviceType) {
    console.error("ERROR: You must provide the service type as an argument.");
    console.error(
      "Available services: distribution, verifier-distribution, judge",
    );
    process.exit(1);
  }

  switch (serviceType) {
    case "distribution":
      await runDistributionService();
      break;
    case "verifier-distribution":
      await runVerifierDistributionService();
      break;
    case "judge":
      await runJudgeService();
      break;
    default:
      console.error(`ERROR: Unknown service type '${serviceType}'.`);
      console.error(
        "Available services: distribution, verifier-distribution, judge",
      );
      process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
