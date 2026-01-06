import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createDb } from "@torus-ts/db/client";
import { PredictionJudge } from "./judge";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (!process.env.OPENROUTER_API_KEY) {
  console.error("missing OPENROUTER_API_KEY env var");
  process.exit(1);
}

if (!process.env.FIRECRAWL_API_KEY) {
  console.error("missing FIRECRAWL_API_KEY env var");
  process.exit(1);
}

const sourceValidationPrompt = await readFile(
  join(__dirname, "../SOURCE_VALIDATION_PROMPT.md"),
  "utf-8",
);

const judge = new PredictionJudge(
  {
    openrouterApiKey: process.env.OPENROUTER_API_KEY,
    concurrency: 8,
    sourceValidationPrompt,
  },
  createDb(),
);

await judge.runJudge(() => false);
