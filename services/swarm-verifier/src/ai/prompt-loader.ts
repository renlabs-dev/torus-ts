import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Loads prompts from markdown files.
 * Simpler than swarm-filter's TOML-based prompts since verification uses single-file prompts.
 */
export class PromptLoader {
  private cache = new Map<string, string>();
  private promptsDir: string;

  constructor(promptsDir?: string) {
    this.promptsDir = promptsDir ?? resolve(process.cwd());
  }

  private loadPrompt(filename: string): string {
    const cached = this.cache.get(filename);
    if (cached !== undefined) {
      return cached;
    }

    const promptPath = resolve(this.promptsDir, filename);

    try {
      const content = readFileSync(promptPath, "utf-8");
      this.cache.set(filename, content);
      return content;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load prompt ${filename}: ${error.message}`);
      }
      throw error;
    }
  }

  getTimeframePrompt(): string {
    return this.loadPrompt("TIMEFRAME_PROMPT.md");
  }

  getFilterValidationPrompt(): string {
    return this.loadPrompt("FILTER_VALIDATION_PROMPT.md");
  }

  getVerdictPrompt(): string {
    return this.loadPrompt("VERDICT_PROMPT.md");
  }

  clearCache(): void {
    this.cache.clear();
  }
}
