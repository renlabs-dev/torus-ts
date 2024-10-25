import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  shared: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  clientPrefix: "NEXT_PUBLIC_",
  client: {
    NEXT_PUBLIC_PORT: z.string().default("3000"),
    NEXT_PUBLIC_WS_PROVIDER_URL: z.string().url(),
  },
  runtimeEnv: process.env,
});
