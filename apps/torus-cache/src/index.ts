import { tryAsyncLoggingRaw } from "@torus-ts/utils/error-helpers/server-operations";
import { updateStakeDataLoop } from "./data";
import { app, port, setup } from "./server";

async function startServer() {
  const [setupError, _setupSuccess] = await tryAsyncLoggingRaw(setup());
  if (setupError !== undefined) {
    console.error("Error setting up server: ", setupError);
    process.exit(1);
  }
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    updateStakeDataLoop().catch(console.error);
  });
}

startServer().catch(console.error);
