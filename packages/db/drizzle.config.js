import { z } from "zod";

const envSchema = z.object({
  POSTGRES_URL: z.string().nonempty({ message: "Missing POSTGRES_URL" }),
});

const env = envSchema.parse(process.env);

export default {
  schema: "./src/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: env.POSTGRES_URL },
};
