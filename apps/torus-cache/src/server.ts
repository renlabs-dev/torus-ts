import { ApiPromise, WsProvider } from "@polkadot/api";
import { tryAsyncLogging } from "@torus-ts/utils/error-helpers/server-operations";
import cors from "cors";
import type { Express } from "express";
import express from "express";
import { env } from "./env";
import routes from "./routes";
import { log } from "./utils";

const port = env.PORT;
const wsEndpoint = env.TORUS_RPC_URL;

async function setup(): Promise<ApiPromise> {
  const provider = new WsProvider(wsEndpoint);
  const [error, api] = await tryAsyncLogging(ApiPromise.create({ provider }));
  if (error !== undefined) {
    log("Error creating API: ", error);
    process.exit(1);
  }
  log("API connected");
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
