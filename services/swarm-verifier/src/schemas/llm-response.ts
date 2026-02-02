import { z } from "zod";

export const TimeframeExtractionSchema = z.object({
  timeframe_status: z.enum([
    "explicit",
    "implicit",
    "inferred",
    "event_trigger",
    "missing",
  ]),
  start_utc: z.string().nullable(),
  end_utc: z.string().nullable(),
  precision: z.enum([
    "hour",
    "day",
    "week",
    "month",
    "quarter",
    "year",
    "unbounded",
    "event",
  ]),
  reasoning: z.string(),
  assumptions: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export type TimeframeExtractionResult = z.infer<
  typeof TimeframeExtractionSchema
>;

export const FilterValidationSchema = z.object({
  context: z.string(),
  is_valid: z.boolean(),
  failure_cause: z
    .enum([
      "BROKEN_EXTRACTION",
      "VAGUE_TARGET",
      "PRESENT_STATE",
      "NEGATION",
      "SARCASM",
      "QUOTING_OTHERS",
      "HEAVY_HEDGING",
      "FUTURE_TIMEFRAME",
      "SELF_ANNOUNCEMENT",
      "PERSONAL_ACTION",
      "OTHER",
    ])
    .nullable(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

export type FilterValidationResult = z.infer<typeof FilterValidationSchema>;

export const VerdictSourceSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  snippet: z.string(),
});

export type VerdictSource = z.infer<typeof VerdictSourceSchema>;

export const VerdictSchema = z.object({
  valid: z.boolean(),
  verdict: z.boolean(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  sources: z.array(VerdictSourceSchema),
});

export type VerdictResult = z.infer<typeof VerdictSchema>;
