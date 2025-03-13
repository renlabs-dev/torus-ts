import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  shared: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  clientPrefix: "NEXT_PUBLIC_",
  server: {
    TORUS_RPC_URL: z.string().url(),
    PORT: z.string().default("3000"),
  },
  client: {},
  runtimeEnv: process.env,
});
