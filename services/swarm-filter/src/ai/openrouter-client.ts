import OpenAI from "openai";
import type { z } from "zod";
import { ZodError } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export interface OpenRouterConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
  defaultTemperature?: number;
  defaultMaxTokens?: number;
}

export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
}

/**
 * OpenRouter Client
 *
 * Wraps the OpenAI SDK to work with OpenRouter's API.
 * Provides structured output with Zod schema validation.
 */
export class OpenRouterClient {
  private client: OpenAI;
  private model: string;
  private defaultTemperature: number;
  private defaultMaxTokens: number;

  constructor(config: OpenRouterConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL ?? "https://openrouter.ai/api/v1",
      timeout: 120000,
      maxRetries: 0,
    });

    this.model = config.model ?? "google/gemini-2.5-flash";
    this.defaultTemperature = config.defaultTemperature ?? 0.7;
    this.defaultMaxTokens = config.defaultMaxTokens ?? 4096;
  }

  /**
   * Complete with structured JSON output
   *
   * Uses OpenAI's structured output feature to ensure valid JSON responses
   * that conform to the provided Zod schema.
   *
   * @param systemPrompt - System message defining the AI's role
   * @param userPrompt - User message with the actual request
   * @param outputSchema - Zod schema for validation
   * @param options - Optional temperature and maxTokens overrides
   * @returns Validated response matching the schema
   */
  async completeStructured<T>(
    systemPrompt: string,
    userPrompt: string,
    outputSchema: z.ZodType<T>,
    options?: CompletionOptions,
  ): Promise<T> {
    const temperature = options?.temperature ?? this.defaultTemperature;
    const maxTokens = options?.maxTokens ?? this.defaultMaxTokens;

    const maxRetries = 3;
    let lastError: unknown;

    // Convert Zod schema to JSON Schema for structured outputs
    const rawSchema = zodToJsonSchema(outputSchema, {
      $refStrategy: "none",
    }) as Record<string, unknown>;

    // Ensure additionalProperties: false as required by OpenRouter
    const jsonSchema = {
      type: "object",
      ...rawSchema,
      additionalProperties: false,
    };

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const completion = await this.client.chat.completions.create({
          model: this.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature,
          max_tokens: maxTokens,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "prediction_extraction",
              strict: true,
              schema: jsonSchema,
            },
          },
        });

        const content = completion.choices[0]?.message.content;
        if (!content) {
          throw new Error("No content in completion response");
        }

        // Parse JSON response
        const jsonResponse: unknown = JSON.parse(content);

        // Validate with Zod schema
        const validatedResponse = outputSchema.parse(jsonResponse);

        return validatedResponse;
      } catch (error) {
        lastError = error;

        // Only retry on Zod validation errors
        if (error instanceof ZodError && attempt < maxRetries - 1) {
          continue;
        }

        // Don't retry other errors
        break;
      }
    }

    if (lastError instanceof ZodError) {
      throw new Error(
        `OpenRouter completion failed (Zod validation): ${JSON.stringify(lastError.errors)}`,
      );
    }
    if (lastError instanceof Error) {
      // Log full error for debugging
      console.error(`[OpenRouter] Full error details:`, {
        message: lastError.message,
        cause: lastError.cause,
        stack: lastError.stack,
      });
      throw new Error(`OpenRouter completion failed: ${lastError.message}`);
    }
    throw lastError;
  }

  /**
   * Complete with JSON output (no strict schema enforcement)
   *
   * Asks the model to respond with JSON via response_format, but doesn't
   * enforce a strict schema. Useful for models that don't support json_schema.
   * Falls back to this automatically if structured output fails.
   *
   * @param systemPrompt - System message defining the AI's role
   * @param userPrompt - User message with the actual request
   * @param outputSchema - Zod schema for validation
   * @param options - Optional temperature and maxTokens overrides
   * @returns Validated response matching the schema
   */
  async completeJSON<T>(
    systemPrompt: string,
    userPrompt: string,
    outputSchema: z.ZodType<T>,
    options?: CompletionOptions,
  ): Promise<T> {
    const temperature = options?.temperature ?? this.defaultTemperature;
    const maxTokens = options?.maxTokens ?? this.defaultMaxTokens;

    const maxRetries = 3;
    let lastError: unknown;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const completion = await this.client.chat.completions.create({
          model: this.model,
          messages: [
            {
              role: "system",
              content: systemPrompt + "\n\nRespond with valid JSON only.",
            },
            { role: "user", content: userPrompt },
          ],
          temperature,
          max_tokens: maxTokens,
          response_format: { type: "json_object" }, // Simple JSON mode
        });

        const content = completion.choices[0]?.message.content;
        if (!content) {
          throw new Error("No content in completion response");
        }

        // Parse JSON response
        const jsonResponse: unknown = JSON.parse(content);

        // Validate with Zod schema
        const validatedResponse = outputSchema.parse(jsonResponse);

        return validatedResponse;
      } catch (error) {
        lastError = error;

        // Only retry on Zod validation errors
        if (error instanceof ZodError && attempt < maxRetries - 1) {
          continue;
        }

        // Don't retry other errors
        break;
      }
    }

    if (lastError instanceof ZodError) {
      throw new Error(
        `OpenRouter completion failed (Zod validation): ${JSON.stringify(lastError.errors)}`,
      );
    }
    if (lastError instanceof Error) {
      console.error(`[OpenRouter] Full error details:`, {
        message: lastError.message,
        cause: lastError.cause,
        stack: lastError.stack,
      });
      throw new Error(`OpenRouter completion failed: ${lastError.message}`);
    }
    throw lastError;
  }

  /**
   * Execute a prompt with variable substitution
   *
   * This is a convenience method that combines prompt loading with completion.
   * The actual prompt loading happens externally via prompt-loader.
   *
   * @param systemPrompt - System prompt (after variable substitution)
   * @param userPrompt - User prompt (after variable substitution)
   * @param outputSchema - Zod schema for validation
   * @param options - Optional completion options
   * @returns Validated response
   */
  async executePrompt<T>(
    systemPrompt: string,
    userPrompt: string,
    outputSchema: z.ZodType<T>,
    options?: CompletionOptions,
  ): Promise<T> {
    return this.completeStructured(
      systemPrompt,
      userPrompt,
      outputSchema,
      options,
    );
  }

  /**
   * Get the current model being used
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Change the model for future requests
   */
  setModel(model: string): void {
    this.model = model;
  }
}
