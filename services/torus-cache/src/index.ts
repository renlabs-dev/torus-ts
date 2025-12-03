import { BasicLogger } from "@torus-network/torus-utils/logger";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { updateStakeDataLoop } from "./data";
import { app, port, setup } from "./server";

const log = BasicLogger.create({ name: "torus-cache" });

async function startServer() {
  const setupRes = await tryAsync(setup());
  const setupErrorMsg = "Failed to setup server";
  if (log.ifResultIsErr(setupRes, setupErrorMsg)) process.exit(1);

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    updateStakeDataLoop().catch(console.error);
  });
}

startServer().catch(console.error);
