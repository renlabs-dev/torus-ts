import "@polkadot/api-augment";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { queryLastBlock } from "@torus-network/sdk";
import { BasicLogger } from "@torus-network/torus-utils/logger";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import express from "express";
import { z } from "zod";
// import { log } from "./common";
import { parseEnvOrExit } from "./common/env";
import { agentFetcherWorker } from "./workers/agent-fetcher";
import { notifyNewApplicationsWorker } from "./workers/notify-dao-applications";
import { processApplicationsWorker } from "./workers/process-dao-applications";
import { weightAggregatorWorker } from "./workers/weight-aggregator";

export const env = parseEnvOrExit(
  z.object({
    NEXT_PUBLIC_TORUS_RPC_URL: z.string().url(),
  }),
)(process.env);

const log = BasicLogger.create({ name: "weight-aggregator" });

/**
 * Initializes connection to the Torus blockchain.
 * Creates a WebSocket provider using the configured RPC endpoint
 * and establishes an API connection.
 *
 * @returns API instance ready for blockchain interactions
 * @throws Exits process on connection failure
 */
async function setup(): Promise<ApiPromise> {
  const wsEndpoint = env.NEXT_PUBLIC_TORUS_RPC_URL;

  log.info("Connecting to ", wsEndpoint);

  const provider = new WsProvider(wsEndpoint);
  const apiCreateRes = await tryAsync(ApiPromise.create({ provider }));
  if (log.ifResultIsErr(apiCreateRes)) process.exit(1);
  const [_apiCreateErr, api] = apiCreateRes;

  return api;
}

/**
 * Application entry point that parses command line arguments to determine
 * which worker to run. Performs initial blockchain setup and health check
 * configuration before starting the requested worker.
 *
 * Worker selection is based on the first command line argument, with validation
 * to ensure a valid worker is specified.
 *
 * @throws Exits process on errors in setup, initialization, or worker execution
 */
async function main() {
  const setupRes = await tryAsync(setup());
  if (log.ifResultIsErr(setupRes)) process.exit(1);
  const [_setupErr, api] = setupRes;

  const lastBlockNumber = -1;
  const queryLastBlockRes = await tryAsync(queryLastBlock(api));
  if (log.ifResultIsErr(queryLastBlockRes)) process.exit(1);
  const [_queryLastBlockErr, lastBlock] = queryLastBlockRes;

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

  const workerRes = await tryAsync(workerFn());
  if (log.ifResultIsErr(workerRes)) process.exit(1);
}

/**
 * Creates a simple HTTP server that provides an endpoint for health checks.
 * Used by infrastructure monitoring to verify worker process health.
 *
 * The server responds with the worker type to identify which specific
 * worker is running in the current process.
 *
 * @param workerType - Current worker identifier to include in health check response
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
