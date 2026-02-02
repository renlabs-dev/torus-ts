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

    this.model = config.model ?? "anthropic/claude-sonnet-4";
    this.defaultTemperature = config.defaultTemperature ?? 0.7;
    this.defaultMaxTokens = config.defaultMaxTokens ?? 4096;
  }

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

    const rawSchema = zodToJsonSchema(outputSchema, {
      $refStrategy: "none",
    }) as Record<string, unknown>;

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
              name: "verification_response",
              strict: true,
              schema: jsonSchema,
            },
          },
        });

        const content = completion.choices[0]?.message.content;
        if (!content) {
          throw new Error("No content in completion response");
        }

        const jsonResponse: unknown = JSON.parse(content);
        const validatedResponse = outputSchema.parse(jsonResponse);

        return validatedResponse;
      } catch (error) {
        lastError = error;

        if (error instanceof ZodError && attempt < maxRetries - 1) {
          continue;
        }

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

  async completeWithSearch<T>(
    systemPrompt: string,
    userPrompt: string,
    outputSchema: z.ZodType<T>,
    options?: CompletionOptions,
  ): Promise<T> {
    const temperature = options?.temperature ?? this.defaultTemperature;
    const maxTokens = options?.maxTokens ?? this.defaultMaxTokens;

    const maxRetries = 3;
    let lastError: unknown;

    const rawSchema = zodToJsonSchema(outputSchema, {
      $refStrategy: "none",
    }) as Record<string, unknown>;

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
              name: "verification_response",
              strict: true,
              schema: jsonSchema,
            },
          },
          // Enable web search via OpenRouter plugins
          // @ts-expect-error - OpenRouter-specific parameter
          plugins: [{ id: "web" }],
        });

        const content = completion.choices[0]?.message.content;
        if (!content) {
          throw new Error("No content in completion response");
        }

        const jsonResponse: unknown = JSON.parse(content);
        const validatedResponse = outputSchema.parse(jsonResponse);

        return validatedResponse;
      } catch (error) {
        lastError = error;

        if (error instanceof ZodError && attempt < maxRetries - 1) {
          continue;
        }

        break;
      }
    }

    if (lastError instanceof ZodError) {
      throw new Error(
        `OpenRouter completion failed (Zod validation): ${JSON.stringify(lastError.errors)}`,
      );
    }
    if (lastError instanceof Error) {
      throw new Error(`OpenRouter completion failed: ${lastError.message}`);
    }
    throw lastError;
  }

  getModel(): string {
    return this.model;
  }
}
