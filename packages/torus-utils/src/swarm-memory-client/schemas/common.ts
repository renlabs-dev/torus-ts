import { z } from "zod";

/**
 * RFC3339 DateTime string schema (flexible format)
 * Accepts various ISO datetime formats from the API
 */
export const RFC3339DateTimeSchema = z
  .string()
  .refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid datetime format",
  });

/**
 * Agent address schema (wallet address)
 */
export const AgentAddressSchema = z.string();

/**
 * Base pagination parameters schema
 */
export const PaginationParamsSchema = z.object({
  agent_address: AgentAddressSchema.optional(),
  from: RFC3339DateTimeSchema.optional(),
  to: RFC3339DateTimeSchema.optional(),
  limit: z.number().min(1).max(1000).optional(),
  offset: z.number().min(0).optional(),
  search: z.string().optional(),
  sort_order: z.enum(["asc", "desc"]).optional(),
});

/**
 * Pagination response schema wrapper
 */
export const PaginationResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T,
) =>
  z.object({
    data: z.array(itemSchema),
    total_count: z.number(),
    has_more: z.boolean(),
    offset: z.number().optional(),
  });

/**
 * SwarmMemory API response wrapper schema
 */
export const SwarmApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  });

/**
 * Type definitions derived from schemas
 */
export type RFC3339DateTime = z.infer<typeof RFC3339DateTimeSchema>;
export type AgentAddress = z.infer<typeof AgentAddressSchema>;
export type PaginationParams = z.infer<typeof PaginationParamsSchema>;
export interface PaginationResponse<T> {
  data: T[];
  total_count: number;
  has_more: boolean;
  offset?: number;
}
export interface SwarmApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
