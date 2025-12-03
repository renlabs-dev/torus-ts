/**
 * Retroactive deduplication script.
 * Usage: pnpm --filter torus-swarm-verifier dev:dedup-retroactive
 */

import { createDb } from "@torus-ts/db/client";
import type { DB } from "@torus-ts/db/client";
import {
  deduplicationProcessedConversationsSchema,
  parsedPredictionSchema,
  predictionDuplicateRelationsSchema,
  scrapedTweetSchema,
} from "@torus-ts/db/schema";
import { and, eq, gt, isNotNull, isNull, max, or, sql } from "drizzle-orm";
import type { ParsedPredictionForDedup } from "./verifier.js";
import { comparePredictions } from "./verifier.js";

interface DuplicateRelation {
  predictionId: string;
  canonicalId: string;
  similarityScore: number;
}

let interrupted = false;
const globalStats = {
  totalConversations: 0,
  processedCount: 0,
  skippedCount: 0,
  totalPredictions: 0,
  totalDuplicatesInserted: 0,
  conversationsWithDuplicates: 0,
  errors: 0,
};

function printSummary() {
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY" + (interrupted ? " (interrupted)" : ""));
  console.log("=".repeat(60));
  console.log(`Conversations to process: ${globalStats.totalConversations}`);
  console.log(`Conversations processed: ${globalStats.processedCount}`);
  console.log(
    `Conversations skipped (already done): ${globalStats.skippedCount}`,
  );
  console.log(`Total predictions analyzed: ${globalStats.totalPredictions}`);
  console.log(
    `Conversations with duplicates: ${globalStats.conversationsWithDuplicates}`,
  );
  console.log(
    `Total duplicate relations inserted: ${globalStats.totalDuplicatesInserted}`,
  );
  if (globalStats.errors > 0) {
    console.log(`Errors encountered: ${globalStats.errors}`);
  }
  console.log("\n=== " + (interrupted ? "INTERRUPTED" : "COMPLETE") + " ===");
}

process.on("SIGINT", () => {
  console.log("\n\nInterrupted by user (Ctrl+C)");
  interrupted = true;
  printSummary();
  process.exit(0);
});

function buildDuplicateClusters(
  predictions: ParsedPredictionForDedup[],
): DuplicateRelation[] {
  const predById = new Map<string, ParsedPredictionForDedup>();
  const parent = new Map<string, string>();

  for (const pred of predictions) {
    predById.set(pred.id, pred);
    parent.set(pred.id, pred.id);
  }

  function find(id: string): string {
    const p = parent.get(id);
    if (p === undefined || p === id) return id;
    const root = find(p);
    parent.set(id, root);
    return root;
  }

  function union(id1: string, id2: string): void {
    const root1 = find(id1);
    const root2 = find(id2);
    if (root1 === root2) return;
    if (root1 < root2) {
      parent.set(root2, root1);
    } else {
      parent.set(root1, root2);
    }
  }

  for (let i = 0; i < predictions.length; i++) {
    for (let j = i + 1; j < predictions.length; j++) {
      const pred1 = predictions[i];
      const pred2 = predictions[j];
      if (!pred1 || !pred2) continue;

      if (comparePredictions(pred1, pred2).isDuplicate) {
        union(pred1.id, pred2.id);
      }
    }
  }

  const relations: DuplicateRelation[] = [];
  for (const pred of predictions) {
    const root = find(pred.id);
    if (root !== pred.id) {
      const canonical = predById.get(root);
      if (canonical) {
        const result = comparePredictions(pred, canonical);
        relations.push({
          predictionId: pred.id,
          canonicalId: root,
          similarityScore: (result.targetScore + result.timeframeScore) / 2,
        });
      }
    }
  }

  return relations;
}

async function processConversation(
  db: DB,
  conversationId: bigint,
): Promise<{ predictionsProcessed: number; duplicatesFound: number }> {
  const predictions = await db
    .select({
      id: parsedPredictionSchema.id,
      predictionId: parsedPredictionSchema.predictionId,
      target: parsedPredictionSchema.target,
      timeframe: parsedPredictionSchema.timeframe,
    })
    .from(parsedPredictionSchema)
    .innerJoin(
      scrapedTweetSchema,
      eq(scrapedTweetSchema.predictionId, parsedPredictionSchema.predictionId),
    )
    .where(eq(scrapedTweetSchema.conversationId, conversationId));

  if (predictions.length < 2) {
    return { predictionsProcessed: predictions.length, duplicatesFound: 0 };
  }

  const relations = buildDuplicateClusters(
    predictions as ParsedPredictionForDedup[],
  );

  if (relations.length > 0) {
    await db
      .insert(predictionDuplicateRelationsSchema)
      .values(
        relations.map((r) => ({
          predictionId: r.predictionId,
          canonicalId: r.canonicalId,
          similarityScore: r.similarityScore.toFixed(4),
        })),
      )
      .onConflictDoNothing();
  }

  await db
    .insert(deduplicationProcessedConversationsSchema)
    .values({
      conversationId,
      predictionsProcessed: predictions.length,
      duplicatesFound: relations.length,
    })
    .onConflictDoUpdate({
      target: deduplicationProcessedConversationsSchema.conversationId,
      set: {
        predictionsProcessed: predictions.length,
        duplicatesFound: relations.length,
        updatedAt: new Date(),
      },
    });

  return {
    predictionsProcessed: predictions.length,
    duplicatesFound: relations.length,
  };
}

async function main() {
  console.log("=== RETROACTIVE DEDUPLICATION ===\n");
  console.log("Connecting to database...");

  const db = createDb();

  // Get the global cutoff - max updatedAt from deduplication table.
  // Conversations with all predictions before this were already processed.
  const cutoffResult = await db
    .select({
      maxUpdatedAt: max(deduplicationProcessedConversationsSchema.updatedAt),
    })
    .from(deduplicationProcessedConversationsSchema);
  const globalCutoff = cutoffResult[0]?.maxUpdatedAt;

  if (globalCutoff) {
    console.log(`Global cutoff: ${globalCutoff.toISOString()}`);
  } else {
    console.log(
      "No previous deduplication records found, processing all conversations",
    );
  }

  console.log("Fetching conversations with new predictions...\n");

  // Find conversations that have predictions newer than:
  // - Their deduplication record's createdAt (if exists)
  // - The global cutoff (if no dedup record exists)
  const conversations = await db
    .selectDistinct({
      conversationId: scrapedTweetSchema.conversationId,
    })
    .from(scrapedTweetSchema)
    .innerJoin(
      parsedPredictionSchema,
      eq(scrapedTweetSchema.predictionId, parsedPredictionSchema.predictionId),
    )
    .leftJoin(
      deduplicationProcessedConversationsSchema,
      eq(
        scrapedTweetSchema.conversationId,
        deduplicationProcessedConversationsSchema.conversationId,
      ),
    )
    .where(
      and(
        isNotNull(scrapedTweetSchema.predictionId),
        isNotNull(scrapedTweetSchema.conversationId),
        or(
          // Conversation has dedup record but has newer predictions
          and(
            isNotNull(deduplicationProcessedConversationsSchema.updatedAt),
            gt(
              parsedPredictionSchema.createdAt,
              deduplicationProcessedConversationsSchema.updatedAt,
            ),
          ),
          // No dedup record and (no cutoff OR prediction is newer than cutoff)
          and(
            isNull(deduplicationProcessedConversationsSchema.updatedAt),
            globalCutoff
              ? gt(parsedPredictionSchema.createdAt, globalCutoff)
              : sql`true`,
          ),
        ),
      ),
    );

  globalStats.totalConversations = conversations.length;
  console.log(
    `Found ${conversations.length} conversations with new predictions\n`,
  );

  if (conversations.length === 0) {
    console.log("Nothing to process!");
    process.exit(0);
  }

  for (const { conversationId } of conversations) {
    if (interrupted) break;
    if (conversationId === null) continue;

    globalStats.processedCount++;
    if (globalStats.processedCount % 100 === 0) {
      console.log(
        `Progress: ${globalStats.processedCount}/${conversations.length} ` +
          `(${((globalStats.processedCount / conversations.length) * 100).toFixed(1)}%) - ` +
          `${globalStats.totalDuplicatesInserted} duplicates inserted`,
      );
    }

    try {
      const result = await processConversation(db, conversationId);
      globalStats.totalPredictions += result.predictionsProcessed;
      globalStats.totalDuplicatesInserted += result.duplicatesFound;
      if (result.duplicatesFound > 0) {
        globalStats.conversationsWithDuplicates++;
      }
    } catch (err) {
      globalStats.errors++;
      console.error(`Error processing conversation ${conversationId}:`, err);
    }
  }

  printSummary();
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  printSummary();
  process.exit(1);
});
