import { blake2AsHex, signatureVerify } from "@polkadot/util-crypto";
import { and, eq, gt, inArray, isNull, notExists } from "@torus-ts/db";
import {
  parsedPredictionSchema,
  predictionDuplicateRelationsSchema,
  predictionTopicSchema,
  scrapedTweetSchema,
  twitterUsersSchema,
  verdictSchema,
  verificationClaimSchema,
  verifierFeedbackSchema,
  verifierTopicRegistrationSchema,
} from "@torus-ts/db/schema";
import type { FailureCause } from "@torus-ts/db/schema";
import canonicalize from "canonicalize";
import { requirePermission } from "../middleware/auth";
import type { ContextApp } from "../middleware/context";
import {
  claimableQuerySchema,
  claimSubmissionSchema,
  feedbackSubmissionSchema,
  registerTopicSchema,
} from "../schemas/claims";
import type {
  ClaimSubmission,
  FeedbackSubmission,
  RegisterTopic,
} from "../schemas/claims";
import { HttpError } from "../utils/errors";

export const claimsRouter = (app: ContextApp) =>
  app.use(requirePermission(["prediction.verify"])).group("/v1", (app) =>
    app
      .get(
        "/predictions/claimable",
        async ({ query, db, userKey }) => {
          const { after, limit, topics } = query;

          const noVerdict = notExists(
            db
              .select()
              .from(verdictSchema)
              .where(
                eq(verdictSchema.parsedPredictionId, parsedPredictionSchema.id),
              ),
          );

          const noFeedbackFromVerifier = notExists(
            db
              .select()
              .from(verifierFeedbackSchema)
              .where(
                and(
                  eq(
                    verifierFeedbackSchema.parsedPredictionId,
                    parsedPredictionSchema.id,
                  ),
                  eq(verifierFeedbackSchema.verifierAgentId, userKey),
                  isNull(verifierFeedbackSchema.deletedAt),
                ),
              ),
          );

          const notDuplicate = notExists(
            db
              .select()
              .from(predictionDuplicateRelationsSchema)
              .where(
                eq(
                  predictionDuplicateRelationsSchema.predictionId,
                  parsedPredictionSchema.id,
                ),
              ),
          );

          const noClaimFromVerifier = notExists(
            db
              .select()
              .from(verificationClaimSchema)
              .where(
                and(
                  eq(
                    verificationClaimSchema.parsedPredictionId,
                    parsedPredictionSchema.id,
                  ),
                  eq(verificationClaimSchema.verifierAgentId, userKey),
                  isNull(verificationClaimSchema.deletedAt),
                ),
              ),
          );

          const conditions = [
            noVerdict,
            noFeedbackFromVerifier,
            notDuplicate,
            noClaimFromVerifier,
          ];

          if (after) {
            conditions.push(gt(parsedPredictionSchema.id, after));
          }

          if (topics && topics.length > 0) {
            conditions.push(inArray(predictionTopicSchema.name, topics));
          }

          const predictions = await db
            .select({
              id: parsedPredictionSchema.id,
              predictionId: parsedPredictionSchema.predictionId,
              target: parsedPredictionSchema.target,
              timeframe: parsedPredictionSchema.timeframe,
              topicName: predictionTopicSchema.name,
              createdAt: parsedPredictionSchema.createdAt,
            })
            .from(parsedPredictionSchema)
            .innerJoin(
              predictionTopicSchema,
              eq(predictionTopicSchema.id, parsedPredictionSchema.topicId),
            )
            .where(and(...conditions))
            .orderBy(parsedPredictionSchema.id)
            .limit(limit);

          const lastPrediction = predictions[predictions.length - 1];
          const nextCursor = lastPrediction?.id ?? null;

          return {
            predictions: predictions.map((p) => ({
              id: p.id,
              predictionId: p.predictionId,
              target: p.target,
              timeframe: p.timeframe,
              topicName: p.topicName,
              createdAt: p.createdAt.toISOString(),
            })),
            nextCursor,
            hasMore: predictions.length === limit,
          };
        },
        { query: claimableQuerySchema },
      )
      .post(
        "/predictions/:id/claim",
        async ({ params, body, db, userKey, serverSignHash }) => {
          const predictionId = params.id;
          const input = body as ClaimSubmission;

          const sentAt = new Date(input.content.sentAt);
          const now = new Date();
          const diffMs = Math.abs(now.getTime() - sentAt.getTime());
          const maxTimestampDiffMs = 300 * 1000;

          if (diffMs > maxTimestampDiffMs) {
            throw new HttpError(
              400,
              `Invalid timestamp: sentAt is ${Math.floor(diffMs / 1000)}s off (max ${maxTimestampDiffMs / 1000}s allowed)`,
            );
          }

          const contentCanonical = canonicalize(input.content);
          if (!contentCanonical) {
            throw new HttpError(500, "Failed to canonicalize content");
          }
          const contentHash = blake2AsHex(contentCanonical);

          const verification = signatureVerify(
            contentHash,
            input.metadata.signature,
            userKey,
          );

          if (!verification.isValid) {
            throw new HttpError(
              400,
              "Invalid signature: signature does not match content or was not signed by authenticated agent",
            );
          }

          const prediction = await db
            .select({ id: parsedPredictionSchema.id })
            .from(parsedPredictionSchema)
            .where(eq(parsedPredictionSchema.id, predictionId))
            .limit(1);

          if (prediction.length === 0) {
            throw new HttpError(404, `Prediction ${predictionId} not found`);
          }

          const existingVerdict = await db
            .select({ id: verdictSchema.id })
            .from(verdictSchema)
            .where(eq(verdictSchema.parsedPredictionId, predictionId))
            .limit(1);

          if (existingVerdict.length > 0) {
            throw new HttpError(
              400,
              "Cannot submit claim: prediction already has a verdict",
            );
          }

          const [insertedClaim] = await db
            .insert(verificationClaimSchema)
            .values({
              parsedPredictionId: predictionId,
              verifierAgentId: userKey,
              verifierAgentSignature: input.metadata.signature,
              claimOutcome: input.content.outcome,
              confidence: input.content.confidence,
              reasoning: input.content.reasoning,
              sources: input.content.sources,
              timeframeStartUtc: new Date(input.content.timeframe.startUtc),
              timeframeEndUtc: new Date(input.content.timeframe.endUtc),
              timeframePrecision: input.content.timeframe.precision,
            })
            .onConflictDoNothing()
            .returning({ id: verificationClaimSchema.id });

          if (!insertedClaim) {
            throw new HttpError(
              400,
              "You have already submitted a claim for this prediction",
            );
          }

          const receiptTimestamp = new Date().toISOString();
          const receiptData = {
            claimId: insertedClaim.id,
            parsedPredictionId: predictionId,
            timestamp: receiptTimestamp,
          };
          const receiptCanonical = canonicalize(receiptData);
          if (!receiptCanonical) {
            throw new HttpError(500, "Failed to canonicalize receipt data");
          }
          const receiptHash = blake2AsHex(receiptCanonical);
          const serverSignature = serverSignHash(receiptHash);

          return {
            claimId: insertedClaim.id,
            parsedPredictionId: predictionId,
            receipt: {
              signature: serverSignature,
              timestamp: receiptTimestamp,
            },
          };
        },
        { body: claimSubmissionSchema },
      )
      .post(
        "/verifiers/register-topic",
        async ({ body, db, userKey }) => {
          const { topicId } = body as RegisterTopic;

          const topic = await db
            .select({ id: predictionTopicSchema.id })
            .from(predictionTopicSchema)
            .where(eq(predictionTopicSchema.id, topicId))
            .limit(1);

          if (topic.length === 0) {
            throw new HttpError(404, `Topic ${topicId} not found`);
          }

          const [registration] = await db
            .insert(verifierTopicRegistrationSchema)
            .values({
              verifierAgentId: userKey,
              topicId,
            })
            .onConflictDoNothing()
            .returning({ id: verifierTopicRegistrationSchema.id });

          return {
            registered: registration !== undefined,
            topicId,
          };
        },
        { body: registerTopicSchema },
      )
      .post(
        "/predictions/:id/feedback",
        async ({ params, body, db, userKey }) => {
          const predictionId = params.id;
          const input = body as FeedbackSubmission;

          const sentAt = new Date(input.content.sentAt);
          const now = new Date();
          const diffMs = Math.abs(now.getTime() - sentAt.getTime());
          const maxTimestampDiffMs = 300 * 1000;

          if (diffMs > maxTimestampDiffMs) {
            throw new HttpError(
              400,
              `Invalid timestamp: sentAt is ${Math.floor(diffMs / 1000)}s off (max ${maxTimestampDiffMs / 1000}s allowed)`,
            );
          }

          const contentCanonical = canonicalize(input.content);
          if (!contentCanonical) {
            throw new HttpError(500, "Failed to canonicalize content");
          }
          const contentHash = blake2AsHex(contentCanonical);

          const verification = signatureVerify(
            contentHash,
            input.metadata.signature,
            userKey,
          );

          if (!verification.isValid) {
            throw new HttpError(
              400,
              "Invalid signature: signature does not match content or was not signed by authenticated agent",
            );
          }

          const prediction = await db
            .select({ id: parsedPredictionSchema.id })
            .from(parsedPredictionSchema)
            .where(eq(parsedPredictionSchema.id, predictionId))
            .limit(1);

          if (prediction.length === 0) {
            throw new HttpError(404, `Prediction ${predictionId} not found`);
          }

          const [inserted] = await db
            .insert(verifierFeedbackSchema)
            .values({
              parsedPredictionId: predictionId,
              verifierAgentId: userKey,
              verifierAgentSignature: input.metadata.signature,
              failureCause: input.content.failureCause as FailureCause,
              reason: input.content.reason,
            })
            .onConflictDoUpdate({
              target: [
                verifierFeedbackSchema.parsedPredictionId,
                verifierFeedbackSchema.verifierAgentId,
              ],
              set: {
                verifierAgentSignature: input.metadata.signature,
                failureCause: input.content.failureCause as FailureCause,
                reason: input.content.reason,
                updatedAt: new Date(),
              },
            })
            .returning({ id: verifierFeedbackSchema.id });

          return {
            feedbackId: inserted?.id,
            parsedPredictionId: predictionId,
          };
        },
        { body: feedbackSubmissionSchema },
      )
      .get("/predictions/:id/context", async ({ params, db }) => {
        const predictionId = params.id;

        const prediction = await db
          .select({
            id: parsedPredictionSchema.id,
            predictionId: parsedPredictionSchema.predictionId,
            target: parsedPredictionSchema.target,
            timeframe: parsedPredictionSchema.timeframe,
            topicName: predictionTopicSchema.name,
          })
          .from(parsedPredictionSchema)
          .innerJoin(
            predictionTopicSchema,
            eq(predictionTopicSchema.id, parsedPredictionSchema.topicId),
          )
          .where(eq(parsedPredictionSchema.id, predictionId))
          .limit(1);

        if (prediction.length === 0) {
          throw new HttpError(404, `Prediction ${predictionId} not found`);
        }

        const pred = prediction[0];
        if (!pred) {
          throw new HttpError(404, `Prediction ${predictionId} not found`);
        }

        const targetSlices = pred.target;
        const timeframeSlices = pred.timeframe;
        const allSlices = [...targetSlices, ...timeframeSlices];
        const tweetIds = [
          ...new Set(allSlices.map((s) => BigInt(s.source.tweet_id))),
        ];

        if (tweetIds.length === 0) {
          return {
            id: pred.id,
            predictionId: pred.predictionId,
            target: pred.target,
            timeframe: pred.timeframe,
            tweets: [],
            topicName: pred.topicName,
          };
        }

        const tweets = await db
          .select({
            id: scrapedTweetSchema.id,
            text: scrapedTweetSchema.text,
            authorUsername: twitterUsersSchema.username,
            date: scrapedTweetSchema.date,
          })
          .from(scrapedTweetSchema)
          .leftJoin(
            twitterUsersSchema,
            eq(scrapedTweetSchema.authorId, twitterUsersSchema.id),
          )
          .where(inArray(scrapedTweetSchema.id, tweetIds));

        return {
          id: pred.id,
          predictionId: pred.predictionId,
          target: pred.target,
          timeframe: pred.timeframe,
          tweets: tweets.map((t) => ({
            id: t.id.toString(),
            text: t.text,
            authorUsername: t.authorUsername,
            date: t.date.toISOString(),
          })),
          topicName: pred.topicName,
        };
      }),
  );
