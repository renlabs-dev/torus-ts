import "@polkadot/api-augment";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { queryLastBlock } from "@torus-network/sdk";
import { tryAsyncLoggingRaw } from "@torus-ts/utils/error-helpers/server-operations";
import express from "express";
import { z } from "zod";
import { log } from "./common";
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

async function setup(): Promise<ApiPromise> {
  const wsEndpoint = env.NEXT_PUBLIC_TORUS_RPC_URL;

  log("Connecting to ", wsEndpoint);

  const provider = new WsProvider(wsEndpoint);
  const [apiError, api] = await tryAsyncLoggingRaw(
    ApiPromise.create({ provider }),
  );

  if (apiError) {
    log(
      `Error creating API connection: ${apiError instanceof Error ? apiError.message : JSON.stringify(apiError)}`,
    );
    throw new Error("Failed to create API connection");
  }

  return api;
}

async function main() {
  const [setupError, api] = await tryAsyncLoggingRaw(setup());

  if (setupError) {
    log(
      `Error setting up API: ${setupError instanceof Error ? setupError.message : JSON.stringify(setupError)}`,
    );
    process.exit(1);
  }

  const lastBlockNumber = -1;
  const [blockError, lastBlock] = await tryAsyncLoggingRaw(queryLastBlock(api));

  if (blockError) {
    log(
      `Error querying last block: ${blockError instanceof Error ? blockError.message : JSON.stringify(blockError)}`,
    );
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

  await workerFn();
}

function startHealthCheckServer(workerType: string) {
  const app = express();

  app.get("/api/health", (_, res) => {
    res.send(`${workerType} OK`);
  });

  const port = process.env.PORT ?? 3000;

  app.listen(port, () => {
    log(`/api/health listening on port ${port}`);
  });
}

main()
  .catch(console.error)
  .finally(() => process.exit());
