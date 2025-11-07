import { z } from "zod";

/**
 * Base context fields - common to all context schemas.
 * schema_type is generic here, overridden by specific schemas.
 */
const OtherContextSchema = z.object({
  version: z.literal(2).default(2),
  schema_type: z.literal("other").default("other"),
  relevantContext: z
    .array(z.string())
    .describe(
      "Relevant contextual information that helps verifiers assess the prediction's quality and validity",
    ),
});

/**
 * Crypto context schema - used for cryptocurrency-related predictions.
 */
export const CryptoContextSchema = OtherContextSchema.extend({
  schema_type: z.literal("crypto").default("crypto"),
  tickers: z
    .array(z.string())
    .describe(
      "Cryptocurrency tickers mentioned in the prediction (e.g., BTC, ETH, SOL)",
    ),
  tokens: z
    .array(z.string())
    .describe(
      "Cryptocurrency token names mentioned in the prediction (e.g., Bitcoin, Ethereum, Solana)",
    ),
  bullishness: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe(
      "Bullish sentiment score: 0 = extremely bearish, 50 = neutral, 100 = extremely bullish",
    ),
});

/**
 * Discriminated union of all context schemas.
 * Use this for type-safe handling of different context types.
 */
export const ContextSchema = z.discriminatedUnion("schema_type", [
  OtherContextSchema,
  CryptoContextSchema,
]);

export type OtherContext = z.infer<typeof OtherContextSchema>;
export type CryptoContext = z.infer<typeof CryptoContextSchema>;
export type Context = z.infer<typeof ContextSchema>;

/**
 * Omit metadata fields (version, schema_type) from a context schema.
 * Used to create the schema for LLM output (LLM doesn't fill these fields).
 * Accepts any ZodObject that has version, schema_type, and relevantContext keys.
 */
export function omitContextMetadata<
  T extends z.ZodObject<{
    version: z.ZodTypeAny;
    schema_type: z.ZodTypeAny;
    [key: string]: z.ZodTypeAny;
  }>,
>(schema: T) {
  return schema.omit({ version: true, schema_type: true });
}

/**
 * Map a topic name to the appropriate context schema.
 * Topics are open-ended (politics, sports, technology, etc.)
 * but only specific topics get specialized schemas.
 *
 * @param topic - The topic name from LLM classification
 * @returns The appropriate Zod schema to use for context
 */
export function getContextSchemaForTopic(topic: string) {
  // Special case: crypto gets its own schema with ticker extraction
  if (topic.toLowerCase() === "crypto") {
    return CryptoContextSchema;
  }

  // Default: all other topics use "other" schema
  return OtherContextSchema;
}
