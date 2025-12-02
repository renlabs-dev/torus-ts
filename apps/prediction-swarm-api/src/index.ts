import { BasicLogger } from "@torus-network/torus-utils/logger";
import { getEnv } from "./env";
import { createServer } from "./server";

const logger = BasicLogger.create({ name: "prediction-swarm-api" });

async function main() {
  const env = getEnv(process.env);
  const app = await createServer();
  app.listen(
    {
      port: env.PORT,
      hostname: "0.0.0.0",
    },
    () => {
      logger.info(`Prediction Swarm API listening on 0.0.0.0:${env.PORT}`);
      logger.info(`Health check: http://localhost:${env.PORT}/health`);
      logger.info(`OpenAPI docs: http://localhost:${env.PORT}/openapi`);
    },
  );
}

main().catch((error) => {
  logger.error("Failed to start server:", error);
  process.exit(1);
});
