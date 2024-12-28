import type { Express } from "express";
import { ApiPromise, WsProvider } from "@polkadot/api";
import cors from "cors";
import express from "express";

import { env } from "./env";
import routes from "./routes";
import { log } from "./utils";

const port = env.PORT;
const wsEndpoint = env.TORUS_RPC_URL;

async function setup(): Promise<ApiPromise> {
  const provider = new WsProvider(wsEndpoint);
  const api = await ApiPromise.create({ provider });
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
