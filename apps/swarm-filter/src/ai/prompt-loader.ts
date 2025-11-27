import { readFileSync } from "fs";
import { resolve } from "path";
import * as TOML from "@iarna/toml";
import { z } from "zod";

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
  output_schema: z
    .object({
      type: z.string(),
      required: z.array(z.string()).optional(),
      properties: z.string().optional(),
    })
    .optional(),
  examples: z.array(z.record(z.string(), z.string())).optional(),
});

export const ValidityCriteriaSchema = z.object({
  validity_criteria: z.object({
    content: z.string().min(1),
  }),
});
export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;

/**
 * Prompt Loader
 *
 * Loads and processes TOML-based prompts with variable substitution.
 * Uses Zod for validation instead of unsafe type casting.
 */
export class PromptLoader {
  private cache = new Map<string, PromptTemplate>();
  private promptsDir: string;

  constructor(promptsDir?: string) {
    // Default to prompts/ directory relative to project root
    this.promptsDir = promptsDir ?? resolve(process.cwd(), "prompts");
  }

  /**
   * Load a shared fragment file (any TOML structure)
   *
   * @param fragmentName - Name of the fragment file (without .toml extension)
   * @returns Parsed TOML as any structure
   */
  loadFragment(fragmentName: string): TOML.JsonMap {
    const fragmentPath = resolve(this.promptsDir, `${fragmentName}.toml`);

    try {
      const fileContent = readFileSync(fragmentPath, "utf-8");
      return TOML.parse(fileContent);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to load fragment ${fragmentName}: ${error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Load a TOML prompt file
   *
   * @param promptName - Name of the prompt file (without .toml extension)
   * @returns Parsed and validated prompt template
   */
  loadPrompt(promptName: string): PromptTemplate {
    const cached = this.cache.get(promptName);
    if (cached !== undefined) {
      return cached;
    }

    const promptPath = resolve(this.promptsDir, `${promptName}.toml`);

    try {
      const fileContent = readFileSync(promptPath, "utf-8");
      const parsed = TOML.parse(fileContent);

      const validated = PromptTemplateSchema.parse(parsed);

      this.cache.set(promptName, validated);

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
   * Substitute variables in a template string
   *
   * Variables are in the format {{variable_name}}
   *
   * @param template - Template string with {{variable}} placeholders
   * @param variables - Map of variable names to values
   * @returns Template with variables substituted
   */
  substituteVariables(
    template: string,
    variables: Record<string, string>,
  ): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      result = result.replace(regex, value);
    }

    const remainingVars = result.match(/\{\{([^}]+)\}\}/g);
    if (remainingVars) {
      console.warn(
        `Warning: Unsubstituted variables found: ${remainingVars.join(", ")}`,
      );
    }

    return result;
  }

  /**
   * Load a prompt and substitute variables
   *
   * @param promptName - Name of the prompt file
   * @param variables - Variables to substitute
   * @returns System and user prompts with variables substituted
   */
  loadAndSubstitute(
    promptName: string,
    variables: Record<string, string>,
  ): { system: string; user: string } {
    const prompt = this.loadPrompt(promptName);

    // Load shared validity criteria if needed
    const allVariables = { ...variables };
    if (
      prompt.system.content.includes("{{validity_criteria}}") ||
      prompt.user.template.includes("{{validity_criteria}}")
    ) {
      const validityCriteria = ValidityCriteriaSchema.parse(
        this.loadFragment("shared-validity-criteria"),
      );
      allVariables.validity_criteria =
        validityCriteria.validity_criteria.content;
    }

    return {
      system: this.substituteVariables(prompt.system.content, allVariables),
      user: this.substituteVariables(prompt.user.template, allVariables),
    };
  }

  /**
   * Clear the prompt cache
   *
   * Useful in development when prompts are being modified.
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get all examples from a prompt
   *
   * @param promptName - Name of the prompt file
   * @returns Array of examples or empty array if none exist
   */
  getExamples(promptName: string): Record<string, string>[] {
    const prompt = this.loadPrompt(promptName);
    return prompt.examples ?? [];
  }
}
