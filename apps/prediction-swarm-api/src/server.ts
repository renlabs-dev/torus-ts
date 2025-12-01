import { cors } from "@elysiajs/cors";
import { node } from "@elysiajs/node";
import { openapi } from "@elysiajs/openapi";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { Elysia } from "elysia";
import { zodToJsonSchema } from "zod-to-json-schema";
import { createAppContext } from "./context";
import { getEnv } from "./env";
import { authPlugin, requirePermission } from "./middleware/auth";
import { predictionsRouter } from "./routes/predictions";
import { tweetsRouter } from "./routes/tweets";
import { createSignedError, HttpError } from "./utils/errors";

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiDocs = readFileSync(join(__dirname, "../API_DOCUMENTATION.md"), "utf-8");

export async function createServer() {
  const env = getEnv(process.env);
  const context = await createAppContext(env);

  return new Elysia({ adapter: node() })
    .use(cors({ origin: true, methods: ["GET", "POST"] }))
    .use(
      openapi({
        mapJsonSchema: {
          zod: zodToJsonSchema,
        },
        documentation: {
          info: {
            title: "Prediction Swarm API",
            version: "1.0.0",
            description:
              "REST API for tweet prediction filtering by swarm agents",
          },
          tags: [
            { name: "tweets", description: "Tweet operations" },
            { name: "predictions", description: "Prediction operations" },
          ],
        },
      }),
    )
    .state("db", context.db)
    .state("wsAPI", context.wsAPI)
    .state("permissionCache", context.permissionCache)
    .state("serverSignHash", context.serverSignHash)
    .state("env", context.env)
    .derive(({ body, query }) => ({
      requestInput: body ?? query,
    }))
    .onError(({ code, error, set, requestInput, store }) => {
      const signHash = store.serverSignHash as (hash: string) => string;

      if (error instanceof HttpError) {
        set.status = error.status;
        return createSignedError(error.status, error.message, requestInput, signHash);
      }

      if (code === "VALIDATION") {
        set.status = 400;
        return createSignedError(400, error.message, requestInput, signHash);
      }

      console.error("Unhandled error:", error);
      set.status = 500;
      return createSignedError(500, "Internal server error", requestInput, signHash);
    })
    .get("/", ({ set }) => {
      set.headers["content-type"] = "text/markdown; charset=utf-8";
      return apiDocs;
    })
    .get("/health", () => ({ status: "ok" }))
    .use(authPlugin)
    .use(requirePermission(["prediction.filter"], context.permissionCache))
    .use(tweetsRouter)
    .use(predictionsRouter);
}
