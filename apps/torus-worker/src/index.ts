import "@polkadot/api-augment";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { queryLastBlock } from "@torus-network/sdk";
import { tryAsync } from "@torus-ts/utils/try-catch";
import express from "express";
import { z } from "zod";
import { parseEnvOrExit } from "./common/env";
import { createLogger } from "./common/log";
import { agentFetcherWorker } from "./workers/agent-fetcher";
import { notifyNewApplicationsWorker } from "./workers/notify-dao-applications";
import { processApplicationsWorker } from "./workers/process-dao-applications";
import { weightAggregatorWorker } from "./workers/weight-aggregator";

export const env = parseEnvOrExit(
  z.object({
    NEXT_PUBLIC_TORUS_RPC_URL: z.string().url(),
  }),
)(process.env);

const log = createLogger({ name: "index" });

/**
 * Sets up and creates a connection to the Torus blockchain node
 *
 * @returns A connected API Promise instance
 */
async function setup(): Promise<ApiPromise> {
  const wsEndpoint = env.NEXT_PUBLIC_TORUS_RPC_URL;

  log.info("Connecting to ", wsEndpoint);

  const provider = new WsProvider(wsEndpoint);
  const [apiCreateError, api] = await tryAsync(ApiPromise.create({ provider }));
  if (apiCreateError !== undefined) {
    log.error(apiCreateError);
    process.exit(1);
  }

  return api;
}

/**
 * Main application entry point that initializes the system and starts the appropriate worker
 * based on command line arguments
 */
async function main() {
  const [setupError, api] = await tryAsync(setup());
  if (setupError !== undefined) {
    log.error(setupError);
    process.exit(1);
  }

  const lastBlockNumber = -1;
  const [queryLastBlockError, lastBlock] = await tryAsync(queryLastBlock(api));
  if (queryLastBlockError !== undefined) {
    log.error(queryLastBlockError);
    process.exit(1);
  }

  const workerTypes: Record<string, () => Promise<void>> = {
    // TODO: rename "dao" worker arg
    // TODO: this dont work and dont trow any errors why
    dao: async () => {
      await processApplicationsWorker({
        lastBlock,
        api,
        lastBlockNumber,
      });
    },
    // TODO: rename "dao-notifier" worker arg
    "dao-notifier": async () => {
      await notifyNewApplicationsWorker();
    },
    // TODO: rename "module-fetcher" worker arg to "agent-fetcher"
    "module-fetcher": async () => {
      await agentFetcherWorker({
        lastBlock,
        api,
        lastBlockNumber,
      });
    },
    "weight-aggregator": async () => {
      await weightAggregatorWorker(api);
    },
  };

  const workerTypeArg = process.argv[2];

  if (workerTypeArg == null) {
    console.error("ERROR: You must provide the worker type in a CLI argument.");
    process.exit(1);
  }

  const workerFn = workerTypes[workerTypeArg];

  if (workerFn == null) {
    const workerTypesTxt = Object.keys(workerTypes).join(", ");
    console.error(`ERROR: Invalid worker type '${workerTypeArg}'.`);
    console.error(`Valid worker types are: ${workerTypesTxt}.`);
    process.exit(1);
  }

  startHealthCheckServer(workerTypeArg);

  const [workerError, _] = await tryAsync(workerFn());
  if (workerError !== undefined) {
    log.error(workerError);
    process.exit(1);
  }
}

/**
 * Starts an Express server to provide health check endpoints for the worker
 *
 * @param workerType - The type of worker running in this process
 */
function startHealthCheckServer(workerType: string) {
  const app = express();

  app.get("/api/health", (_, res) => {
    res.send(`${workerType} OK`);
  });

  const port = process.env.PORT ?? 3000;

  app.listen(port, () => {
    log.info(`/api/health listening on port ${port}`);
  });
}

main()
  .catch(console.error)
  .finally(() => process.exit());
