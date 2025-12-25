import { z } from "zod";
import type { CompletionOptions, OpenRouterClient } from "./openrouter-client";
import {
  buildSystemPrompt,
  buildUserPrompt,
  FIELD_LIMITS,
} from "./prompts/resonance-evaluator";

/**
 * Zod schema for a relevant Torus concept identified in the profile.
 */
const RelevantConceptSchema = z.object({
  concept: z
    .string()
    .describe(`Torus concept name (1-${FIELD_LIMITS.concept.maxWords} words)`),
  examples: z
    .array(z.string())
    .max(FIELD_LIMITS.examples.maxItems)
    .describe(
      `Example tweets demonstrating this concept (max ${FIELD_LIMITS.examples.maxChars} chars each)`,
    ),
  alignment: z
    .string()
    .max(FIELD_LIMITS.alignment.maxChars)
    .describe(
      `How this aligns/diverges with Torus (max ${FIELD_LIMITS.alignment.maxChars} chars)`,
    ),
});

/**
 * Zod schema for Torus relevance scoring.
 */
const TorusRelevanceSchema = z.object({
  overallScore: z
    .number()
    .min(FIELD_LIMITS.overallScore.min)
    .max(FIELD_LIMITS.overallScore.max)
    .describe(
      `Overall resonance score from ${FIELD_LIMITS.overallScore.min} to ${FIELD_LIMITS.overallScore.max}`,
    ),
  relevantConcepts: z
    .array(RelevantConceptSchema)
    .max(FIELD_LIMITS.relevantConcepts.maxItems)
    .describe("Key Torus concepts detected"),
  summary: z
    .string()
    .max(FIELD_LIMITS.summary.maxChars)
    .describe(
      `Summary of Torus alignment (max ${FIELD_LIMITS.summary.maxChars} chars)`,
    ),
});

/**
 * Zod schema for a key theme.
 */
const KeyThemeSchema = z.object({
  theme: z.string().describe("Theme name"),
  frequency: z
    .enum(["often", "sometimes", "rarely"])
    .describe("How often this theme appears"),
  description: z
    .string()
    .max(FIELD_LIMITS.themeDescription.maxChars)
    .describe(
      `Theme description (max ${FIELD_LIMITS.themeDescription.maxChars} chars)`,
    ),
});

/**
 * Zod schema for the full evaluation profile returned by the LLM.
 */
export const EvaluationProfileSchema = z.object({
  mainTopics: z
    .array(z.string())
    .max(FIELD_LIMITS.mainTopics.maxItems)
    .describe(
      `Main topics discussed (max ${FIELD_LIMITS.mainTopics.maxItems}, each 1-${FIELD_LIMITS.mainTopics.maxWords} words)`,
    ),
  communicationStyle: z
    .string()
    .max(FIELD_LIMITS.communicationStyle.maxChars)
    .describe(
      `Communication style (max ${FIELD_LIMITS.communicationStyle.maxChars} chars)`,
    ),
  torusRelevance: TorusRelevanceSchema,
  keyThemes: z
    .array(KeyThemeSchema)
    .max(FIELD_LIMITS.keyThemes.maxItems)
    .describe(`Key themes (max ${FIELD_LIMITS.keyThemes.maxItems})`),
  notablePatterns: z
    .array(z.string())
    .max(FIELD_LIMITS.notablePatterns.maxItems)
    .describe(
      `Notable patterns (max ${FIELD_LIMITS.notablePatterns.maxItems}, each max ${FIELD_LIMITS.notablePatterns.maxWords} words)`,
    ),
  overallAssessment: z
    .string()
    .max(FIELD_LIMITS.overallAssessment.maxChars)
    .describe(
      `Overall assessment (max ${FIELD_LIMITS.overallAssessment.maxChars} chars)`,
    ),
});

export type EvaluationProfile = z.infer<typeof EvaluationProfileSchema>;

/**
 * Evidence tweet with ID and text.
 */
export interface EvidenceTweet {
  tweetId: string;
  text: string;
}

/**
 * Result from the resonance evaluator.
 */
export interface EvaluationResult {
  resonanceScore: number;
  evaluationProfile: EvaluationProfile;
  evidenceTweets: EvidenceTweet[];
}

/**
 * Tweet data structure expected from memory_store.xTweetsRaw.
 */
export interface TweetData {
  id?: string;
  text?: string;
  [key: string]: unknown;
}

/**
 * Extract evidence tweets based on concepts found in the evaluation.
 */
function extractEvidenceTweets(
  tweets: TweetData[],
  profile: EvaluationProfile,
): EvidenceTweet[] {
  const evidenceTweets: EvidenceTweet[] = [];

  // Collect example texts from relevant concepts
  const exampleTexts = new Set<string>();
  for (const concept of profile.torusRelevance.relevantConcepts) {
    for (const example of concept.examples) {
      exampleTexts.add(example.toLowerCase());
    }
  }

  // Match tweets that contain the example text (fuzzy matching)
  for (const tweet of tweets) {
    if (!tweet.text || !tweet.id) continue;

    const tweetLower = tweet.text.toLowerCase();
    for (const example of exampleTexts) {
      // Check if the tweet contains a significant portion of the example
      const exampleWords = example.split(/\s+/).slice(0, 5);
      const matchCount = exampleWords.filter((word) =>
        tweetLower.includes(word),
      ).length;

      if (matchCount >= Math.ceil(exampleWords.length * 0.6)) {
        evidenceTweets.push({
          tweetId: tweet.id,
          text: tweet.text,
        });
        break;
      }
    }

    // Limit to 5 evidence tweets
    if (evidenceTweets.length >= 5) break;
  }

  return evidenceTweets;
}

export interface ResonanceEvaluatorConfig {
  client: OpenRouterClient;
}

/**
 * Resonance Evaluator client.
 *
 * Evaluates a Twitter profile's resonance with Torus concepts using an LLM.
 */
export class ResonanceEvaluator {
  private client: OpenRouterClient;

  constructor(config: ResonanceEvaluatorConfig) {
    this.client = config.client;
  }

  /**
   * Evaluate a prospect's resonance with Torus.
   *
   * @param xHandle - Twitter handle (without @)
   * @param xBio - Profile bio (can be null)
   * @param tweets - Array of tweet objects from memory_store.xTweetsRaw
   * @param options - Optional LLM completion options
   */
  async evaluate(
    xHandle: string,
    xBio: string | null,
    tweets: TweetData[],
    options?: CompletionOptions,
  ): Promise<EvaluationResult> {
    const tweetTexts = tweets
      .filter((t): t is TweetData & { text: string } => Boolean(t.text))
      .map((t) => t.text);

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(xHandle, xBio, tweetTexts);

    // Call LLM with JSON mode
    const evaluationProfile = await this.client.completeJSON(
      systemPrompt,
      userPrompt,
      EvaluationProfileSchema,
      options ?? { temperature: 0.7, maxTokens: 4096 },
    );

    // Extract resonance score
    const resonanceScore = evaluationProfile.torusRelevance.overallScore;

    // Extract evidence tweets
    const evidenceTweets = extractEvidenceTweets(tweets, evaluationProfile);

    return {
      resonanceScore,
      evaluationProfile,
      evidenceTweets,
    };
  }
}
