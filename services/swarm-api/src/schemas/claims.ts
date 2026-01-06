import { failureCauseValues } from "@torus-ts/db/schema";
import { z } from "zod";

const decimalSchema = z.string().refine(
  (val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 1;
  },
  { message: "Must be a decimal string between 0 and 1" },
);

export const claimSourceSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  snippet: z.string().optional(),
  retrievedAt: z.string().datetime(),
  archiveUrl: z.string().url().optional(),
});

export const claimTimeframeSchema = z.object({
  startUtc: z.string().datetime(),
  endUtc: z.string().datetime(),
  precision: z.string().min(1),
});

export const claimContentSchema = z.object({
  outcome: z.boolean(),
  confidence: decimalSchema,
  reasoning: z.string().min(1),
  sources: z.array(claimSourceSchema),
  timeframe: claimTimeframeSchema,
  sentAt: z.string().datetime(),
});

export const claimMetadataSchema = z.object({
  signature: z.string().min(1),
  version: z.literal(1),
});

export const claimSubmissionSchema = z.object({
  content: claimContentSchema,
  metadata: claimMetadataSchema,
});

export const claimableQuerySchema = z.object({
  after: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  topics: z
    .string()
    .optional()
    .transform((val) =>
      val
        ? val
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter((t) => t.length > 0)
        : undefined,
    ),
});

export const claimsQuerySchema = z.object({
  after: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export const registerTopicSchema = z.object({
  topicId: z.string().uuid(),
});

export type ClaimSubmission = z.infer<typeof claimSubmissionSchema>;
export type ClaimableQuery = z.infer<typeof claimableQuerySchema>;
export type ClaimsQuery = z.infer<typeof claimsQuerySchema>;
export type RegisterTopic = z.infer<typeof registerTopicSchema>;

export const feedbackContentSchema = z.object({
  failureCause: z.enum(
    Object.keys(failureCauseValues) as [string, ...string[]],
  ),
  reason: z.string().min(1).max(2000),
  sentAt: z.string().datetime(),
});

export const feedbackSubmissionSchema = z.object({
  content: feedbackContentSchema,
  metadata: claimMetadataSchema,
});

export type FeedbackSubmission = z.infer<typeof feedbackSubmissionSchema>;

export const postSliceSchema = z.object({
  source: z.object({
    tweet_id: z.string(),
  }),
  start: z.number(),
  end: z.number(),
});

export const predictionContextTweetSchema = z.object({
  id: z.string(),
  text: z.string(),
  authorUsername: z.string().nullable(),
  date: z.string().datetime(),
});

export const predictionContextResponseSchema = z.object({
  id: z.string().uuid(),
  predictionId: z.string().uuid(),
  target: z.array(postSliceSchema),
  timeframe: z.array(postSliceSchema),
  tweets: z.array(predictionContextTweetSchema),
  topicName: z.string(),
});

export type PredictionContextResponse = z.infer<
  typeof predictionContextResponseSchema
>;
