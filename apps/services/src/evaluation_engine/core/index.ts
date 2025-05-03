import express from "express";
import { createTRPCContext, appRouter } from "./trpc";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// tRPC middleware
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: () => createTRPCContext(),
  })
);

// Start the server
app.listen(port, () => {
  console.log(`Evaluation Engine server listening on port ${port}`);
});