import { blake2AsHex, signatureVerify } from "@polkadot/util-crypto";
import { inArray, sql } from "@torus-ts/db";
import {
  parsedPredictionSchema,
  predictionSchema,
  predictionTopicSchema,
  scrapedTweetSchema,
} from "@torus-ts/db/schema";
import canonicalize from "canonicalize";
import { authPlugin } from "../middleware/auth";
import type { ContextApp } from "../middleware/context";
import { storePredictionsInputSchema } from "../schemas/predictions";
import { HttpError } from "../utils/errors";

export const predictionsRouter = (app: ContextApp) =>
  app.use(authPlugin).group("/v1", (app) =>
    app.post(
      "/storePredictions",
      async ({ body, db, serverSignHash, userKey }) => {
        const agentAddress = userKey;
        const input = body;

        const maxTimestampDiffMs = 300 * 1000;

        for (const [index, item] of input.entries()) {
          const sentAt = new Date(item.content.sentAt);
          const now = new Date();
          const diffMs = Math.abs(now.getTime() - sentAt.getTime());

          if (diffMs > maxTimestampDiffMs) {
            throw new HttpError(
              400,
              `Invalid timestamp for prediction ${index}: sentAt is ${Math.floor(diffMs / 1000)}s off (max ${maxTimestampDiffMs / 1000}s allowed)`,
            );
          }

          const contentCanonical = canonicalize(item.content);
          if (!contentCanonical) {
            throw new HttpError(
              500,
              `Failed to canonicalize content for prediction ${index}`,
            );
          }
          const contentHash = blake2AsHex(contentCanonical);

          const verification = signatureVerify(
            contentHash,
            item.metadata.signature,
            agentAddress,
          );

          if (!verification.isValid) {
            throw new HttpError(
              400,
              `Invalid signature for prediction ${index}: signature does not match content or was not signed by authenticated agent`,
            );
          }
        }

        return await db.transaction(async (tx) => {
          if (input.length === 0) {
            return { inserted: 0 };
          }

          if (input.length > 500) {
            throw new HttpError(
              400,
              "Batch size too large. Maximum 500 predictions per request.",
            );
          }

          const tweetIds = input.map((i) => BigInt(i.content.tweetId));

          await tx.execute(sql`
            SELECT pg_advisory_xact_lock(id)
            FROM unnest(ARRAY[${sql.join(tweetIds, sql`, `)}]::bigint[]) as id
            ORDER BY id
          `);

          const uniqueTopicNames = [
            ...new Set(
              input.map((i) =>
                i.content.prediction.topicName.toLowerCase().trim(),
              ),
            ),
          ];

          const existingTopics = await tx
            .select({
              id: predictionTopicSchema.id,
              name: predictionTopicSchema.name,
            })
            .from(predictionTopicSchema)
            .where(inArray(predictionTopicSchema.name, uniqueTopicNames));

          const topicMap = new Map(
            existingTopics.map((topic) => [topic.name, topic.id]),
          );

          const missingTopics = uniqueTopicNames.filter(
            (n) => !topicMap.has(n),
          );
          if (missingTopics.length > 0) {
            const newTopics = await tx
              .insert(predictionTopicSchema)
              .values(missingTopics.map((name) => ({ name })))
              .onConflictDoNothing()
              .returning();

            newTopics.forEach((topic) => topicMap.set(topic.name, topic.id));

            if (newTopics.length < missingTopics.length) {
              const stillMissing = missingTopics.filter(
                (n) => !topicMap.has(n),
              );
              const refetched = await tx
                .select()
                .from(predictionTopicSchema)
                .where(inArray(predictionTopicSchema.name, stillMissing));
              refetched.forEach((topic) => topicMap.set(topic.name, topic.id));
            }
          }

          const tweets = await tx
            .select({
              id: scrapedTweetSchema.id,
              predictionId: scrapedTweetSchema.predictionId,
            })
            .from(scrapedTweetSchema)
            .where(inArray(scrapedTweetSchema.id, tweetIds));

          const tweetMap = new Map(
            tweets.map((tweet) => [tweet.id.toString(), tweet]),
          );

          const predictionIdMap = new Map<string, string>();

          const tweetsNeedingPredictions: typeof input = [];
          for (const item of input) {
            const tweet = tweetMap.get(item.content.tweetId);
            if (!tweet) {
              throw new HttpError(
                404,
                `Tweet ${item.content.tweetId} not found`,
              );
            }

            if (tweet.predictionId) {
              predictionIdMap.set(item.content.tweetId, tweet.predictionId);
            } else {
              tweetsNeedingPredictions.push(item);
            }
          }

          if (tweetsNeedingPredictions.length > 0) {
            const newPredictions = await tx
              .insert(predictionSchema)
              .values(tweetsNeedingPredictions.map(() => ({ version: 1 })))
              .returning();

            for (let i = 0; i < tweetsNeedingPredictions.length; i++) {
              const item = tweetsNeedingPredictions[i];
              const prediction = newPredictions[i];
              if (!prediction || !item) {
                throw new HttpError(
                  500,
                  `Failed to create prediction for tweet ${item?.content.tweetId ?? "unknown"}`,
                );
              }
              predictionIdMap.set(item.content.tweetId, prediction.id);
            }

            const updateValues = [];
            for (let i = 0; i < tweetsNeedingPredictions.length; i++) {
              const item = tweetsNeedingPredictions[i];
              const prediction = newPredictions[i];
              if (!prediction || !item) {
                throw new HttpError(500, "Prediction creation failed");
              }
              updateValues.push(
                sql`(${BigInt(item.content.tweetId)}, ${prediction.id}::uuid)`,
              );
            }

            await tx.execute(sql`
              UPDATE scraped_tweet
              SET prediction_id = data.pred_id
              FROM (VALUES ${sql.join(updateValues, sql`, `)}) AS data(tweet_id, pred_id)
              WHERE scraped_tweet.id = data.tweet_id
            `);
          }

          for (const item of input) {
            const topicName = item.content.prediction.topicName
              .toLowerCase()
              .trim();
            const predictionId = predictionIdMap.get(item.content.tweetId);
            const topicId = topicMap.get(topicName);

            if (!predictionId || !topicId) {
              throw new HttpError(
                500,
                `Missing predictionId or topicId for tweet ${item.content.tweetId}`,
              );
            }
          }

          const insertedParsedPredictions = await tx
            .insert(parsedPredictionSchema)
            .values(
              input.map((item) => {
                const topicName = item.content.prediction.topicName
                  .toLowerCase()
                  .trim();
                const predictionId = predictionIdMap.get(item.content.tweetId);
                const topicId = topicMap.get(topicName);

                if (!predictionId || !topicId) {
                  throw new Error(
                    `Missing predictionId or topicId for tweet ${item.content.tweetId}`,
                  );
                }

                return {
                  predictionId,
                  topicId,
                  filterAgentId: agentAddress,
                  filterAgentSignature: item.metadata.signature,
                  agentAllegedTimestamp: new Date(item.content.sentAt),
                  target: item.content.prediction.target,
                  timeframe: item.content.prediction.timeframe,
                  predictionQuality: item.content.prediction.predictionQuality,
                  briefRationale: item.content.prediction.briefRationale,
                  llmConfidence: item.content.prediction.llmConfidence,
                  vagueness: item.content.prediction.vagueness,
                  context: item.content.prediction.context,
                };
              }),
            )
            .returning({ id: parsedPredictionSchema.id });

          const parsedPredictionIds = insertedParsedPredictions.map(
            (p) => p.id,
          );

          const receiptTimestamp = new Date().toISOString();
          const receiptData = {
            parsedPredictionIds,
            timestamp: receiptTimestamp,
          };
          const receiptCanonical = canonicalize(receiptData);
          if (!receiptCanonical) {
            throw new HttpError(500, "Failed to canonicalize receipt data");
          }
          const receiptHash = blake2AsHex(receiptCanonical);

          const serverSignature = serverSignHash(receiptHash);

          return {
            inserted: input.length,
            receipt: {
              signature: serverSignature,
              timestamp: receiptTimestamp,
            },
          };
        });
      },
      {
        body: storePredictionsInputSchema,
      },
    ),
  );
