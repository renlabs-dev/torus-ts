import { BasicLogger } from "@torus-network/torus-utils/logger";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import type { JobsQueue } from "@torus-ts/db/schema";
import { jobsQueueSchema } from "@torus-ts/db/schema";
import { KaitoTwitterAPI } from "@torus-ts/twitter-client";
import { and, asc, eq, lte } from "drizzle-orm";
import express from "express";
import { ApproachStrategist, OpenRouterClient, ResonanceEvaluator } from "./ai";
import { createApostleSwarmDb } from "./db";
import { env } from "./env";
import {
  handleCheckConversion,
  handleEvaluateProspect,
  handleGenerateStrategy,
  handleScrapeProspect,
} from "./handlers";
import { sleep } from "./utils";

const log = BasicLogger.create({ name: "apostle-swarm-worker" });

/**
 * Start health check HTTP server.
 * Provides /api/health endpoint for k8s probes.
 */
function startHealthCheckServer(): void {
  const app = express();
  app.get("/api/health", (_, res) => {
    res.send("apostle-swarm-worker OK");
  });
  const port = env.PORT;
  app.listen(port, () => {
    log.info(`Health check server listening on port ${port}`);
  });
}

/**
 * Fetch the next pending job from the queue.
 * Returns undefined if no jobs are available.
 */
async function fetchNextJob(
  db: ReturnType<typeof createApostleSwarmDb>,
): Promise<JobsQueue | undefined> {
  const now = new Date();

  // Select oldest PENDING job where runAt <= now
  const [job] = await db
    .select()
    .from(jobsQueueSchema)
    .where(
      and(
        eq(jobsQueueSchema.status, "PENDING"),
        lte(jobsQueueSchema.runAt, now),
      ),
    )
    .orderBy(asc(jobsQueueSchema.runAt))
    .limit(1);

  return job;
}

/**
 * Mark a job as RUNNING.
 */
async function markJobRunning(
  db: ReturnType<typeof createApostleSwarmDb>,
  jobId: string,
): Promise<void> {
  await db
    .update(jobsQueueSchema)
    .set({
      status: "RUNNING",
      updatedAt: new Date(),
    })
    .where(eq(jobsQueueSchema.id, jobId));
}

/**
 * Mark a job as COMPLETED.
 */
async function markJobCompleted(
  db: ReturnType<typeof createApostleSwarmDb>,
  jobId: string,
): Promise<void> {
  await db
    .update(jobsQueueSchema)
    .set({
      status: "COMPLETED",
      updatedAt: new Date(),
    })
    .where(eq(jobsQueueSchema.id, jobId));
}

/**
 * Mark a job as FAILED with error message.
 */
async function markJobFailed(
  db: ReturnType<typeof createApostleSwarmDb>,
  jobId: string,
  error: string,
): Promise<void> {
  await db
    .update(jobsQueueSchema)
    .set({
      status: "FAILED",
      lastError: error.slice(0, 2000), // Truncate to avoid DB issues
      updatedAt: new Date(),
    })
    .where(eq(jobsQueueSchema.id, jobId));
}

/**
 * Context for job processing, containing all required clients.
 */
interface JobProcessingContext {
  db: ReturnType<typeof createApostleSwarmDb>;
  twitterClient: KaitoTwitterAPI;
  evaluator: ResonanceEvaluator;
  strategist: ApproachStrategist;
}

/**
 * Process a single job by dispatching to the appropriate handler.
 */
async function processJob(
  ctx: JobProcessingContext,
  job: JobsQueue,
): Promise<void> {
  switch (job.jobType) {
    case "SCRAPE_PROSPECT":
      await handleScrapeProspect(
        { db: ctx.db, twitterClient: ctx.twitterClient },
        job.payload,
      );
      break;
    case "EVALUATE_PROSPECT":
      await handleEvaluateProspect(
        { db: ctx.db, evaluator: ctx.evaluator },
        job.payload,
      );
      break;
    case "GENERATE_STRATEGY":
      await handleGenerateStrategy(
        { db: ctx.db, strategist: ctx.strategist },
        job.payload,
      );
      break;
    case "CHECK_CONVERSION":
      await handleCheckConversion({ db: ctx.db }, job.payload);
      break;
    default: {
      const _exhaustiveCheck: never = job.jobType;
      throw new Error(`Unknown job type: ${_exhaustiveCheck as string}`);
    }
  }
}

/**
 * Main worker loop.
 * Polls for pending jobs and processes them.
 */
async function runWorker(): Promise<void> {
  const db = createApostleSwarmDb();
  const twitterClient = new KaitoTwitterAPI({
    apiKey: env.TWITTERAPI_IO_KEY,
  });

  // Create OpenRouter clients for each task
  const evaluationClient = new OpenRouterClient({
    apiKey: env.OPENROUTER_API_KEY,
    model: env.EVALUATION_MODEL,
  });
  const strategyClient = new OpenRouterClient({
    apiKey: env.OPENROUTER_API_KEY,
    model: env.STRATEGY_MODEL,
  });

  // Create AI service clients
  const evaluator = new ResonanceEvaluator({ client: evaluationClient });
  const strategist = new ApproachStrategist({ client: strategyClient });

  const ctx: JobProcessingContext = {
    db,
    twitterClient,
    evaluator,
    strategist,
  };

  log.info("Worker started, polling for jobs...");
  log.info(`Evaluation model: ${env.EVALUATION_MODEL}`);
  log.info(`Strategy model: ${env.STRATEGY_MODEL}`);

  let consecutiveFailures = 0;
  const maxBackoff = 1000 * 60 * 5; // 5 minutes max backoff

  while (true) {
    // Fetch next pending job
    const [fetchErr, job] = await tryAsync(fetchNextJob(db));
    if (fetchErr !== undefined) {
      log.error(`Failed to fetch job: ${fetchErr.message}`);
      consecutiveFailures++;
      const backoff = Math.min(
        1000 * Math.pow(2, consecutiveFailures),
        maxBackoff,
      );
      await sleep(backoff);
      continue;
    }

    // No jobs available, wait and try again
    if (job === undefined) {
      consecutiveFailures = 0;
      await sleep(env.JOB_POLL_INTERVAL_MS);
      continue;
    }

    log.info(`Processing job ${job.id} (type: ${job.jobType})`);

    // Mark job as running
    const [markRunErr] = await tryAsync(markJobRunning(db, job.id));
    if (markRunErr !== undefined) {
      log.error(
        `Failed to mark job ${job.id} as RUNNING: ${markRunErr.message}`,
      );
      consecutiveFailures++;
      const backoff = Math.min(
        1000 * Math.pow(2, consecutiveFailures),
        maxBackoff,
      );
      await sleep(backoff);
      continue;
    }

    // Process the job
    const [processErr] = await tryAsync(processJob(ctx, job));

    if (processErr !== undefined) {
      log.error(`Job ${job.id} failed: ${processErr.message}`);
      const [markFailErr] = await tryAsync(
        markJobFailed(db, job.id, processErr.message),
      );
      if (markFailErr !== undefined) {
        log.error(
          `Failed to mark job ${job.id} as FAILED: ${markFailErr.message}`,
        );
      }
      // Don't increase backoff on job processing errors (vs infrastructure errors)
      continue;
    }

    // Mark job as completed
    const [markCompleteErr] = await tryAsync(markJobCompleted(db, job.id));
    if (markCompleteErr !== undefined) {
      log.error(
        `Failed to mark job ${job.id} as COMPLETED: ${markCompleteErr.message}`,
      );
      // Job was processed but we couldn't update status - not ideal but continue
    }

    log.info(`Job ${job.id} completed successfully`);
    consecutiveFailures = 0;
  }
}

/**
 * Main entry point.
 */
async function main(): Promise<void> {
  log.info("Apostle Swarm Worker starting...");

  // Start health check server
  startHealthCheckServer();

  // Run the worker loop
  await runWorker();
}

main().catch((err) => {
  log.error(`Fatal error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
