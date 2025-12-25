import { z } from "zod";
import type { CompletionOptions, OpenRouterClient } from "./openrouter-client";
import type { EvaluationProfile } from "./resonance-evaluator";

/**
 * Zod schema for the approach strategy output.
 */
export const ApproachStrategySchema = z.object({
  recommendedAngle: z
    .string()
    .max(300)
    .describe("How to approach this person based on their interests and style"),
  narrativeFrame: z
    .string()
    .max(300)
    .describe("The frame or story to use when introducing Torus"),
  hooks: z
    .array(z.string().max(200))
    .max(4)
    .describe("Concrete opening messages or topics to engage with"),
  risks: z
    .array(z.string().max(150))
    .max(3)
    .describe("Things to avoid or watch out for when approaching"),
});

export type ApproachStrategy = z.infer<typeof ApproachStrategySchema>;

/**
 * System prompt for the approach strategist.
 */
function buildSystemPrompt(): string {
  return `You are the Approach Strategist for Torus Apostle Swarm.

# About Torus

Torus is an open-ended stake-based p2p protocol encoding biological principles of autonomy and self-organization into coordination infrastructure. It models intelligence as distributed, adaptive coordination under constraints.

# About Apostle Swarm

The Apostle Swarm is a coordination surface for targeted outreach to recruit individuals whose worldview resonates with Torus. Apostles are vetted participants who engage with high-potential prospects identified through resonance evaluation.

# Your Task

Given an evaluation profile of a Twitter user, generate a personalized approach strategy for an apostle to use when reaching out. The strategy should:

1. **Leverage resonance points** — Use the concepts and themes that already resonate with this person's worldview.

2. **Match communication style** — Adapt the approach to their tone and aesthetic preferences.

3. **Provide concrete hooks** — Give specific opening messages or topics that would naturally lead into a Torus conversation.

4. **Identify risks** — Note potential pitfalls based on their patterns (e.g., if they dislike hype, avoid promotional language).

# Rules

- Be specific and actionable, not generic.
- Ground recommendations in the evaluation data provided.
- Keep hooks conversational and authentic, not salesy.
- The goal is genuine connection, not manipulation.
- Output MUST be valid JSON only, respecting all length limits.`;
}

/**
 * Build the user prompt with the evaluation profile.
 */
function buildUserPrompt(
  xHandle: string,
  evaluationProfile: EvaluationProfile,
): string {
  return `Generate an approach strategy for reaching out to @${xHandle}.

Evaluation Profile:
${JSON.stringify(evaluationProfile, null, 2)}

Based on this profile, provide a personalized approach strategy.

Return your strategy as a single JSON object with these fields:

{
  "recommendedAngle": "How to approach this person (max 280 chars)",
  "narrativeFrame": "The story/frame to use when introducing Torus (max 280 chars)",
  "hooks": [
    "Concrete opening message or topic 1 (max 180 chars)",
    "Opening message or topic 2 (max 180 chars)"
  ],
  "risks": [
    "Thing to avoid 1 (max 140 chars)",
    "Thing to avoid 2 (max 140 chars)"
  ]
}

Requirements:
- recommendedAngle: ≤280 characters
- narrativeFrame: ≤280 characters
- hooks: ≤4 items, each ≤180 characters
- risks: ≤3 items, each ≤140 characters

Ground your recommendations in the specific details from the evaluation profile. Be concrete and actionable.`;
}

export interface ApproachStrategistConfig {
  client: OpenRouterClient;
}

/**
 * Approach Strategist client.
 *
 * Generates personalized outreach strategies based on evaluation profiles.
 */
export class ApproachStrategist {
  private client: OpenRouterClient;

  constructor(config: ApproachStrategistConfig) {
    this.client = config.client;
  }

  /**
   * Generate an approach strategy for a prospect.
   *
   * @param xHandle - Twitter handle (without @)
   * @param evaluationProfile - The evaluation profile from resonance evaluator
   * @param options - Optional LLM completion options
   * @returns Generated approach strategy
   */
  async generateStrategy(
    xHandle: string,
    evaluationProfile: EvaluationProfile,
    options?: CompletionOptions,
  ): Promise<ApproachStrategy> {
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(xHandle, evaluationProfile);

    const strategy = await this.client.completeJSON(
      systemPrompt,
      userPrompt,
      ApproachStrategySchema,
      options ?? { temperature: 0.7, maxTokens: 2048 },
    );

    return strategy;
  }
}
