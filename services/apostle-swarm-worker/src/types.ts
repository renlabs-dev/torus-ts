import { z } from "zod";

/**
 * Payload schema for SCRAPE_PROSPECT jobs.
 * Contains the prospect ID to scrape Twitter data for.
 */
export const ScrapeProspectPayloadSchema = z.object({
  prospect_id: z.string().uuid(),
});
export type ScrapeProspectPayload = z.infer<typeof ScrapeProspectPayloadSchema>;

/**
 * Payload schema for EVALUATE_PROSPECT jobs.
 * Contains the prospect ID to evaluate.
 */
export const EvaluateProspectPayloadSchema = z.object({
  prospect_id: z.string().uuid(),
});
export type EvaluateProspectPayload = z.infer<
  typeof EvaluateProspectPayloadSchema
>;

/**
 * Payload schema for GENERATE_STRATEGY jobs.
 * Contains the prospect ID to generate approach strategy for.
 */
export const GenerateStrategyPayloadSchema = z.object({
  prospect_id: z.string().uuid(),
});
export type GenerateStrategyPayload = z.infer<
  typeof GenerateStrategyPayloadSchema
>;

/**
 * Payload schema for CHECK_CONVERSION jobs.
 * Contains the prospect ID to check conversion status for.
 */
export const CheckConversionPayloadSchema = z.object({
  prospect_id: z.string().uuid(),
});
export type CheckConversionPayload = z.infer<
  typeof CheckConversionPayloadSchema
>;

/**
 * Union of all job payload types.
 */
export type JobPayload =
  | ScrapeProspectPayload
  | EvaluateProspectPayload
  | GenerateStrategyPayload
  | CheckConversionPayload;
