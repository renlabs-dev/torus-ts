import { z } from "zod";
import type { CompletionOptions, OpenRouterClient } from "./openrouter-client";

/**
 * Zod schema for a relevant Torus concept identified in the profile.
 */
const RelevantConceptSchema = z.object({
  concept: z.string().describe("Torus concept name (1-3 words)"),
  examples: z
    .array(z.string())
    .max(2)
    .describe("Example tweets demonstrating this concept (max 120 chars each)"),
  alignment: z
    .string()
    .max(140)
    .describe("How this aligns/diverges with Torus (max 120 chars)"),
});

/**
 * Zod schema for Torus relevance scoring.
 */
const TorusRelevanceSchema = z.object({
  overallScore: z
    .number()
    .min(0)
    .max(10)
    .describe("Overall resonance score from 0 to 10"),
  relevantConcepts: z
    .array(RelevantConceptSchema)
    .max(3)
    .describe("Key Torus concepts detected"),
  summary: z
    .string()
    .max(260)
    .describe("Summary of Torus alignment (max 240 chars)"),
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
    .max(140)
    .describe("Theme description (max 120 chars)"),
});

/**
 * Zod schema for the full evaluation profile returned by the LLM.
 */
export const EvaluationProfileSchema = z.object({
  mainTopics: z
    .array(z.string())
    .max(5)
    .describe("Main topics discussed (max 5, each 1-3 words)"),
  communicationStyle: z
    .string()
    .max(160)
    .describe("Communication style (max 140 chars)"),
  torusRelevance: TorusRelevanceSchema,
  keyThemes: z.array(KeyThemeSchema).max(3).describe("Key themes (max 3)"),
  notablePatterns: z
    .array(z.string())
    .max(5)
    .describe("Notable patterns (max 5, each max 6 words)"),
  overallAssessment: z
    .string()
    .max(300)
    .describe("Overall assessment (max 280 chars)"),
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
 * Torus context for the system prompt.
 * This provides the LLM with background on what Torus is about.
 */
const TORUS_CONTEXT = `Torus is an open-ended stake-based p2p protocol encoding biological principles of autonomy and self-organization into coordination infrastructure.

Torus models intelligence as distributed, adaptive coordination under constraints: agents self-assemble, specialize, and align through recursive delegation, shared incentives, and feedback. It treats organization as a living process, not a fixed structure.

Key concepts:
- Distributed coordination and swarm intelligence
- Stake-weighted governance and resource allocation
- Recursive delegation hierarchies
- Constraint-based autonomy
- Emergent organization through feedback loops
- Cybernetic principles applied to social systems`;

/**
 * System prompt for the resonance evaluator.
 * Ported from apostle-swarm profile-analyzer.ts.
 */
function buildSystemPrompt(): string {
  return `You are the resonance evaluator.

Your job is to read a Twitter profile and recent tweets, and judge how strongly this person's worldview resonates with Torus—an open-ended stake-based p2p protocol encoding biological principles of autonomy and self-organization into coordination infrastructure.

# About Torus

${TORUS_CONTEXT}

# Your Task

Your task is to detect conceptual resonance, not vocabulary or tone similarity. A person need not mention Torus to fit its worldview.

Evaluate intuitively across five dimensions:

1. **Orientation to complexity** — Do they perceive systems as interdependent, adaptive, alive?

2. **Epistemic depth** — Do they reason in gradients, feedbacks, tradeoffs, rather than binaries?

3. **Coordination sense** — Do they explore how cooperation or intelligence emerges across agents or scales?

4. **Tone & aesthetic** — Expression shows depth more than performance; curiosity > outrage; irony without cynicism.

5. **Cultural adjacency** — Any visible orbit around complexity, cybernetics, distributed systems, evolution, or philosophy of organization.

# Rules

- Look at how they think, not what they talk about.
- Reward pattern-level curiosity, tolerance for uncertainty, and systemic reasoning.
- Penalize moral grandstanding, binary worldviews, or pure hype.
- Resonance = alignment with Torus' view of intelligence as distributed, adaptive coordination under constraint.
- Do not fabricate quotes or examples; if none are available, leave the examples array empty.
- Prefer information density over adjectives; do not restate Torus context in your output.

# Brevity Policy (strict)
- Output MUST be valid JSON only (no prose or headers).
- Obey hard limits from the user prompt; if needed, drop low-salience items rather than exceed limits.`;
}

/**
 * Build the user prompt for evaluation.
 */
function buildUserPrompt(
  xHandle: string,
  xBio: string | null,
  tweets: TweetData[],
): string {
  const tweetTexts = tweets
    .filter((t) => t.text)
    .map((t, i) => `Tweet ${i + 1}: ${t.text}`)
    .join("\n\n");

  const bioSection = xBio ? `Bio: ${xBio}\n\n` : "";

  return `Analyze the following Twitter profile:

Handle: @${xHandle}
${bioSection}${tweetTexts}

Return your analysis as a single JSON object ONLY (no extra text), following these HARD LIMITS:

- mainTopics: ≤5 items; each 1~3 words.
- communicationStyle: ≤140 characters.
- torusRelevance.overallScore: integer 0-10.
- torusRelevance.relevantConcepts: ≤3 items.
  - concept: 1~3 words.
  - examples: ≤2 items; each ≤120 characters (or empty if none available).
  - alignment: ≤120 characters.
- torusRelevance.summary: ≤240 characters.
- keyThemes: ≤3 items; description ≤120 characters each.
- notablePatterns: ≤5 items; each ≤6 words.
- overallAssessment: ≤280 characters.

If you must cut, drop the least-salient items rather than exceed limits. Do not invent specifics.

Provide your analysis in EXACTLY this JSON schema (field names unchanged):

{
  "mainTopics": ["topic1", "topic2", "topic3"],
  "communicationStyle": "≤140 chars",
  "torusRelevance": {
    "overallScore": 7,
    "relevantConcepts": [
      {
        "concept": "Torus concept name (1~3 words)",
        "examples": ["example ≤120 chars", "example ≤120 chars"],
        "alignment": "≤120 chars explaining align/diverge"
      }
    ],
    "summary": "≤240 chars"
  },
  "keyThemes": [
    {
      "theme": "theme name",
      "frequency": "often/sometimes/rarely",
      "description": "≤120 chars"
    }
  ],
  "notablePatterns": ["pattern1", "pattern2"],
  "overallAssessment": "≤280 chars"
}`;
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
 * Ported from apostle-swarm profile-analyzer.ts.
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
   * @returns Evaluation result with score, profile, and evidence tweets
   */
  async evaluate(
    xHandle: string,
    xBio: string | null,
    tweets: TweetData[],
    options?: CompletionOptions,
  ): Promise<EvaluationResult> {
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(xHandle, xBio, tweets);

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
