import { cors } from "@elysiajs/cors";
import { node } from "@elysiajs/node";
import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { zodToJsonSchema } from "zod-to-json-schema";
import { createAppContext } from "./context";
import { getEnv } from "./env";
import { authPlugin, requirePermission } from "./middleware/auth";
import { predictionsRouter } from "./routes/predictions";
import { tweetsRouter } from "./routes/tweets";
import { HttpError } from "./utils/errors";

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
    .onError(({ code, error, set }) => {
      if (error instanceof HttpError) {
        set.status = error.status;
        return { error: error.message, status: error.status };
      }

      if (code === "VALIDATION") {
        set.status = 400;
        return { error: "Validation error", details: error.message };
      }

      console.error("Unhandled error:", error);
      set.status = 500;
      return { error: "Internal server error" };
    })
    .get("/health", () => ({ status: "ok" }))
    .use(authPlugin)
    .use(requirePermission(["prediction.filter"], context.permissionCache))
    .use(tweetsRouter)
    .use(predictionsRouter);
}
