import "@polkadot/api-augment";

import express from "express";
import { z } from "zod";

import { ApiPromise, WsProvider } from "@polkadot/api";

import { queryLastBlock } from "@torus-ts/subspace";

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
  const api = await ApiPromise.create({ provider });

  return api;
}

async function main() {
  const api = await setup();
  const lastBlockNumber = -1;
  const lastBlock = await queryLastBlock(api);

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
      await notifyNewApplicationsWorker({
        lastBlock,
        api,
        lastBlockNumber,
      });
    },
    // TODO: rename "module-fetcher" worker arg to "agent-fetcher"
    "module-fetcher": async () => {
      await agentFetcherWorker({
        lastBlock,
        api,
        lastBlockNumber,
      });
    },
    // TODO: This explodes due to zod errors
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
