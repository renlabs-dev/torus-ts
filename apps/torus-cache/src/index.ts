import { updateStakeDataLoop } from "./data";
import { app, port, setup } from "./server";

async function startServer() {
  try {
    await setup();
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      updateStakeDataLoop().catch(console.error);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer().catch(console.error);
