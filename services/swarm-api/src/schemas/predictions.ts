import { ContextSchema, parsedPredictionSchema } from "@torus-ts/db/schema";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const PG_BIGINT_MAX = 2n ** 63n - 1n;

const tweetIdSchema = z
  .string()
  .min(1)
  .refine(
    (val) => {
      try {
        const bigIntVal = BigInt(val);
        return bigIntVal > 0n && bigIntVal <= PG_BIGINT_MAX;
      } catch {
        return false;
      }
    },
    { message: "Tweet ID must be a valid positive integer within range" },
  );

const predictionSourceSchema = z.object({
  tweet_id: tweetIdSchema,
});

const postSliceSchema = z.object({
  source: predictionSourceSchema,
  start: z.number(),
  end: z.number(),
});

const decimalSchema = z.string().refine(
  (val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 1;
  },
  { message: "Must be a decimal string between 0 and 1" },
);

export const PARSED_PREDICTION_INSERT_SCHEMA = createInsertSchema(
  parsedPredictionSchema,
)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    predictionId: true,
    topicId: true,
    filterAgentId: true,
    filterAgentSignature: true,
    target: true,
    timeframe: true,
    context: true,
    llmConfidence: true,
    vagueness: true,
  })
  .extend({
    target: z.array(postSliceSchema),
    timeframe: z.array(postSliceSchema),
    context: ContextSchema.optional(),
    llmConfidence: decimalSchema,
    vagueness: decimalSchema.optional(),
  });

export const predictionContentSchema = z.object({
  tweetId: tweetIdSchema,
  sentAt: z.string().datetime(),
  prediction: PARSED_PREDICTION_INSERT_SCHEMA.extend({
    topicName: z.string().min(1),
  }),
});

export const predictionMetadataSchema = z.object({
  signature: z.string(),
  version: z.literal(1),
});

export const storePredictionItemSchema = z.object({
  content: predictionContentSchema,
  metadata: predictionMetadataSchema,
});

export const storePredictionsInputSchema = z.array(storePredictionItemSchema);

export type StorePredictionItem = z.infer<typeof storePredictionItemSchema>;
export type StorePredictionsInput = z.infer<typeof storePredictionsInputSchema>;
