import { z } from "zod";
import type { CompletionOptions, OpenRouterClient } from "./openrouter-client";
import { FIELD_LIMITS, getPromptLoader } from "./prompt-loader";
import type { EvaluationProfile } from "./resonance-evaluator";

/**
 * Zod schema for the approach strategy output.
 */
export const ApproachStrategySchema = z.object({
  recommendedAngle: z
    .string()
    .max(FIELD_LIMITS.recommendedAngle.maxChars)
    .describe("How to approach this person based on their interests and style"),
  narrativeFrame: z
    .string()
    .max(FIELD_LIMITS.narrativeFrame.maxChars)
    .describe("The frame or story to use when introducing Torus"),
  hooks: z
    .array(z.string().max(FIELD_LIMITS.hooks.maxChars))
    .max(FIELD_LIMITS.hooks.maxItems)
    .describe("Concrete opening messages or topics to engage with"),
  risks: z
    .array(z.string().max(FIELD_LIMITS.risks.maxChars))
    .max(FIELD_LIMITS.risks.maxItems)
    .describe("Things to avoid or watch out for when approaching"),
});

export type ApproachStrategy = z.infer<typeof ApproachStrategySchema>;

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
    const promptLoader = getPromptLoader();
    const { system: systemPrompt, user: userPrompt } =
      promptLoader.buildApproachStrategistPrompts(xHandle, evaluationProfile);

    const strategy = await this.client.completeJSON(
      systemPrompt,
      userPrompt,
      ApproachStrategySchema,
      options ?? { temperature: 0.7, maxTokens: 2048 },
    );

    return strategy;
  }
}
