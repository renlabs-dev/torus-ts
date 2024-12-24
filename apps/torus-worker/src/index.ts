import "@polkadot/api-augment";

import { ApiPromise, WsProvider } from "@polkadot/api";
import express from "express";

import { queryLastBlock } from "@torus-ts/subspace";

import { log } from "./common";
import { agentFetcherWorker } from "./workers/agent-fetcher";
import { notifyNewApplicationsWorker } from "./workers/notify-dao-applications";
import { processDaoApplicationsWorker } from "./workers/process-dao-applications";
import { weightAggregatorWorker } from "./workers/weight-aggregator";

import { env } from "./env";

async function setup(): Promise<ApiPromise> {
  const wsEndpoint = env.NEXT_PUBLIC_WS_PROVIDER_URL;

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
    dao: async () => {
      await processDaoApplicationsWorker({
        lastBlock,
        api,
        lastBlockNumber,
      });
    },
    "dao-notifier": async () => {
      await notifyNewApplicationsWorker({
        lastBlock,
        api,
        lastBlockNumber,
      });
    },
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

  if (workerTypeArg == undefined) {
    console.error("ERROR: You must provide the worker type in a CLI argument.");
    process.exit(1);
  }

  const workerFn = workerTypes[workerTypeArg];

  if (workerFn == undefined) {
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
