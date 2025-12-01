import { z } from "zod";

export const getTweetsNextQuerySchema = z.object({
  from: z.string(),
  limit: z.coerce.number().int().positive().default(10),
  excludeProcessedByAgent: z
    .string()
    .optional()
    .transform((val) => val === "true"),
});

export type GetTweetsNextQuery = z.infer<typeof getTweetsNextQuerySchema>;

export const tweetSchema = z.object({
  id: z.string(),
  text: z.string(),
  authorId: z.string(),
  date: z.date(),
  quotedId: z.string().nullable(),
  conversationId: z.string().nullable(),
  parentTweetId: z.string().nullable(),
});

export const getTweetsNextResponseSchema = z.object({
  tweets: z.array(
    z.object({
      main: tweetSchema,
      context: z.record(z.string(), tweetSchema),
    }),
  ),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export type Tweet = z.infer<typeof tweetSchema>;
export type GetTweetsNextResponse = z.infer<typeof getTweetsNextResponseSchema>;
