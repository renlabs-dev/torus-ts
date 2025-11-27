import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createDb } from "@torus-ts/db/client";
import { PredictionVerifier } from "./verifier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (!process.env.OPENROUTER_API_KEY) {
  console.error("missing OPENROUTER_API_KEY env var");
  process.exit(1);
}

const timeframePrompt = await readFile(
  join(__dirname, "../TIMEFRAME_PROMPT.md"),
  "utf-8",
);

const filterValidationPrompt = await readFile(
  join(__dirname, "../FILTER_VALIDATION_PROMPT.md"),
  "utf-8",
);

const verdictPrompt = await readFile(
  join(__dirname, "../VERDICT_PROMPT.md"),
  "utf-8",
);

const scraper = new PredictionVerifier(
  {
    openrouterApiKey: process.env.OPENROUTER_API_KEY,
    concurrency: 8,
    timeframePrompt,
    filterValidationPrompt,
    verdictPrompt,
  },
  createDb(),
);

await scraper.runVerifier(() => false);
