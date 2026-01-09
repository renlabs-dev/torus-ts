import { readFileSync } from "fs";
import { resolve } from "path";
import * as TOML from "@iarna/toml";
import { z } from "zod";

/**
 * Zod schema for field limit configuration
 */
const FieldLimitSchema = z.object({
  max_items: z.number().optional(),
  max_words: z.number().optional(),
  max_chars: z.number().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
});

/**
 * Zod schema for TOML prompt structure
 */
const PromptTemplateSchema = z.object({
  system: z.object({
    content: z.string(),
  }),
  user: z.object({
    template: z.string(),
  }),
  field_limits: z.record(z.string(), FieldLimitSchema).optional(),
});

/**
 * Zod schema for resonance dimension
 */
const ResonanceDimensionSchema = z.object({
  name: z.string(),
  question: z.string(),
});

/**
 * Zod schema for strategy principle
 */
const StrategyPrincipleSchema = z.object({
  name: z.string(),
  guidance: z.string(),
});

/**
 * Zod schema for shared context
 */
const SharedContextSchema = z.object({
  torus_context: z.object({
    description: z.string(),
    key_concepts: z.array(z.string()),
  }),
  apostle_swarm: z.object({
    description: z.string(),
  }),
  resonance_dimensions: z.object({
    description: z.string(),
    dimensions: z.array(ResonanceDimensionSchema),
  }),
  evaluation_rules: z.object({
    positive: z.array(z.string()),
    negative: z.array(z.string()),
    core_principle: z.string(),
  }),
  strategy_principles: z.object({
    description: z.string(),
    principles: z.array(StrategyPrincipleSchema),
  }),
  strategy_rules: z.object({
    guidelines: z.array(z.string()),
  }),
});

export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;
export type SharedContext = z.infer<typeof SharedContextSchema>;
export type FieldLimits = Record<string, z.infer<typeof FieldLimitSchema>>;

/**
 * Prompt Loader
 *
 * Loads and processes TOML-based prompts with variable substitution.
 */
export class PromptLoader {
  private promptCache = new Map<string, PromptTemplate>();
  private sharedContext: SharedContext | null = null;
  private promptsDir: string;

  constructor(promptsDir?: string) {
    this.promptsDir = promptsDir ?? resolve(process.cwd(), "prompts");
  }

  /**
   * Load and cache shared context
   */
  private loadSharedContext(): SharedContext {
    if (this.sharedContext !== null) {
      return this.sharedContext;
    }

    const contextPath = resolve(this.promptsDir, "shared-context.toml");

    try {
      const fileContent = readFileSync(contextPath, "utf-8");
      const parsed = TOML.parse(fileContent);
      this.sharedContext = SharedContextSchema.parse(parsed);
      return this.sharedContext;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid shared context: ${error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`,
        );
      }
      if (error instanceof Error) {
        throw new Error(`Failed to load shared context: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Load a TOML prompt file
   */
  loadPrompt(promptName: string): PromptTemplate {
    const cached = this.promptCache.get(promptName);
    if (cached !== undefined) {
      return cached;
    }

    const promptPath = resolve(this.promptsDir, `${promptName}.toml`);

    try {
      const fileContent = readFileSync(promptPath, "utf-8");
      const parsed = TOML.parse(fileContent);
      const validated = PromptTemplateSchema.parse(parsed);
      this.promptCache.set(promptName, validated);
      return validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid prompt file ${promptName}: ${error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`,
        );
      }
      if (error instanceof Error) {
        throw new Error(
          `Failed to load prompt ${promptName}: ${error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Get field limits from a prompt
   */
  getFieldLimits(promptName: string): FieldLimits {
    const prompt = this.loadPrompt(promptName);
    return prompt.field_limits ?? {};
  }

  /**
   * Substitute variables in a template string
   */
  private substituteVariables(
    template: string,
    variables: Record<string, string>,
  ): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      result = result.replace(regex, value);
    }

    return result;
  }

  /**
   * Format key concepts as bullet list
   */
  private formatKeyConcepts(context: SharedContext): string {
    return context.torus_context.key_concepts.map((c) => `- ${c}`).join("\n");
  }

  /**
   * Format resonance dimensions
   */
  private formatResonanceDimensions(context: SharedContext): string {
    return context.resonance_dimensions.dimensions
      .map((d, i) => `${i + 1}. **${d.name}** — ${d.question}`)
      .join("\n\n");
  }

  /**
   * Format evaluation rules
   */
  private formatEvaluationRules(context: SharedContext): string {
    const rules = context.evaluation_rules;
    const positiveRules = rules.positive.map((r) => `- ${r}`);
    const negativeRules = rules.negative.map((r) => `- ${r}`);
    return [
      ...positiveRules,
      ...negativeRules,
      `- ${rules.core_principle}`,
    ].join("\n");
  }

  /**
   * Format strategy principles
   */
  private formatStrategyPrinciples(context: SharedContext): string {
    return context.strategy_principles.principles
      .map((p, i) => `${i + 1}. **${p.name}** — ${p.guidance}`)
      .join("\n\n");
  }

  /**
   * Format strategy rules
   */
  private formatStrategyRules(context: SharedContext): string {
    return context.strategy_rules.guidelines.map((r) => `- ${r}`).join("\n");
  }

  /**
   * Build shared context variables
   */
  private buildSharedVariables(): Record<string, string> {
    const context = this.loadSharedContext();

    return {
      torus_description: context.torus_context.description,
      key_concepts: this.formatKeyConcepts(context),
      resonance_dimensions: this.formatResonanceDimensions(context),
      evaluation_rules: this.formatEvaluationRules(context),
      apostle_swarm_description: context.apostle_swarm.description,
      strategy_principles: this.formatStrategyPrinciples(context),
      strategy_rules: this.formatStrategyRules(context),
    };
  }

  /**
   * Build resonance evaluator prompts
   */
  buildResonanceEvaluatorPrompts(
    xHandle: string,
    xBio: string | null,
    tweetTexts: string[],
  ): { system: string; user: string } {
    const prompt = this.loadPrompt("resonance-evaluator");
    const sharedVars = this.buildSharedVariables();

    const tweets = tweetTexts
      .map((text, i) => `Tweet ${i + 1}: ${text}`)
      .join("\n\n");
    const bioSection = xBio ? `Bio: ${xBio}\n\n` : "";

    const userVars: Record<string, string> = {
      x_handle: xHandle,
      bio_section: bioSection,
      tweets: tweets,
    };

    return {
      system: this.substituteVariables(prompt.system.content, sharedVars),
      user: this.substituteVariables(prompt.user.template, userVars),
    };
  }

  /**
   * Build approach strategist prompts
   */
  buildApproachStrategistPrompts(
    xHandle: string,
    evaluationProfile: unknown,
  ): { system: string; user: string } {
    const prompt = this.loadPrompt("approach-strategist");
    const sharedVars = this.buildSharedVariables();

    const userVars: Record<string, string> = {
      x_handle: xHandle,
      evaluation_profile: JSON.stringify(evaluationProfile, null, 2),
    };

    return {
      system: this.substituteVariables(prompt.system.content, sharedVars),
      user: this.substituteVariables(prompt.user.template, userVars),
    };
  }

  /**
   * Clear the prompt cache
   */
  clearCache(): void {
    this.promptCache.clear();
    this.sharedContext = null;
  }
}

/**
 * Singleton loader instance
 */
let loaderInstance: PromptLoader | null = null;

/**
 * Get prompt loader instance
 */
export function getPromptLoader(promptsDir?: string): PromptLoader {
  if (loaderInstance === null) {
    loaderInstance = new PromptLoader(promptsDir);
  }
  return loaderInstance;
}

/**
 * Field limits converted to camelCase for use in Zod schemas
 */
export const FIELD_LIMITS = {
  mainTopics: { maxItems: 5, maxWords: 3 },
  communicationStyle: { maxChars: 140 },
  overallScore: { min: 0, max: 10 },
  relevantConcepts: { maxItems: 3 },
  concept: { maxWords: 3 },
  examples: { maxItems: 2, maxChars: 120 },
  alignment: { maxChars: 120 },
  summary: { maxChars: 240 },
  keyThemes: { maxItems: 3 },
  themeDescription: { maxChars: 120 },
  notablePatterns: { maxItems: 5, maxWords: 6 },
  overallAssessment: { maxChars: 280 },
  // Approach strategist limits
  recommendedAngle: { maxChars: 300 },
  narrativeFrame: { maxChars: 300 },
  hooks: { maxItems: 4, maxChars: 200 },
  risks: { maxItems: 3, maxChars: 150 },
} as const;
