import { z } from "zod";

// Tweet data structure
export const TweetSchema = z.object({
  id: z.string(),
  text: z.string(),
  created_at: z.string(),
  author: z.object({
    username: z.string(),
    name: z.string(),
  }),
  metrics: z
    .object({
      retweet_count: z.number().optional(),
      reply_count: z.number().optional(),
      like_count: z.number().optional(),
      quote_count: z.number().optional(),
    })
    .optional(),
});

export type Tweet = z.infer<typeof TweetSchema>;

// Profile analysis result
export const ProfileAnalysisSchema = z.object({
  username: z.string(),
  analyzedAt: z.string(),
  tweetCount: z.number(),
  analysis: z.object({
    mainTopics: z.array(z.string()),
    communicationStyle: z.string(),
    torusRelevance: z.object({
      overallScore: z.number().min(0).max(10),
      relevantConcepts: z.array(
        z.object({
          concept: z.string(),
          examples: z.array(z.string()),
          alignment: z.string(),
        }),
      ),
      summary: z.string(),
    }),
    keyThemes: z.array(
      z.object({
        theme: z.string(),
        frequency: z.string(),
        description: z.string(),
      }),
    ),
    notablePatterns: z.array(z.string()),
    overallAssessment: z.string(),
  }),
});

export type ProfileAnalysis = z.infer<typeof ProfileAnalysisSchema>;

// TwitterAPI.io response structure (simplified)
export interface TwitterAPIResponse {
  data?: Tweet[];
  meta?: {
    result_count: number;
    next_token?: string;
  };
  errors?: { message: string; type: string }[];
}
