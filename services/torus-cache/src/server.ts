import { ApiPromise, WsProvider } from "@polkadot/api";
import { BasicLogger } from "@torus-network/torus-utils/logger";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import cors from "cors";
import type { Express } from "express";
import express from "express";
import { env } from "./env";
import routes from "./routes";

const log = BasicLogger.create({ name: "torus-cache-server" });

const port = env.PORT;
const wsEndpoint = env.TORUS_RPC_URL;

async function setup(): Promise<ApiPromise> {
  const provider = new WsProvider(wsEndpoint);
  const apiErrorMsg = () => "Error creating API:";
  const apiRes = await tryAsync(ApiPromise.create({ provider }));
  if (log.ifResultIsErr(apiRes, apiErrorMsg)) {
    process.exit(1);
  }
  const [_apiError, api] = apiRes;
  log.info("API connected");
  return api;
}

const app: Express = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(routes);

export { app, port, setup };
