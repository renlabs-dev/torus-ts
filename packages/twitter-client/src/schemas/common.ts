import { z } from "zod";

// Common API response wrapper
export const KaitoApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema.optional(),
    status: z.enum(["success", "error"]),
    msg: z.string().optional(),
  });

// Pagination schemas
export const PaginationParamsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(200).optional(),
});

export const CursorPaginationSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    cursor: z.string().optional(),
    hasMore: z.boolean().optional(),
  });

// URL entity schema (commonly used in Twitter API responses)
export const UrlEntitySchema = z.object({
  display_url: z.string(),
  expanded_url: z.string(),
  indices: z.array(z.number()),
  url: z.string(),
});

export const EntitiesSchema = z.object({
  description: z
    .object({
      urls: z.array(UrlEntitySchema),
    })
    .optional(),
  url: z
    .object({
      urls: z.array(UrlEntitySchema),
    })
    .optional(),
});

export const ProfileBioSchema = z.object({
  description: z.string().optional(),
  entities: EntitiesSchema.optional(),
});

// Common date string schema
export const TwitterDateSchema = z
  .string()
  .refine((date) => !Number.isNaN(Date.parse(date)), {
    message: "Invalid date format",
  });

// Tweet ID schema
export const TweetIdSchema = z
  .string()
  .regex(/^\d+$/, "Invalid tweet ID format");

// User ID schema
export const UserIdSchema = z.string().regex(/^\d+$/, "Invalid user ID format");

// Username schema
export const UsernameSchema = z
  .string()
  .min(1)
  .max(15)
  .regex(/^[a-zA-Z0-9_]+$/, "Invalid username format");

// Common error response schema
export const ErrorResponseSchema = z.object({
  status: z.literal("error"),
  msg: z.string(),
  error_code: z.string().optional(),
});

// Success response schema
export const SuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    status: z.literal("success"),
    data: dataSchema,
    msg: z.string().optional(),
  });

// API response schema that handles both success and error
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.union([SuccessResponseSchema(dataSchema), ErrorResponseSchema]);

// Proxy configuration schema
export const ProxyConfigSchema = z
  .string()
  .regex(
    /^https?:\/\/([\w.-]+:([\w.-]+)?@)?[\w.-]+(:\d+)?$/,
    "Invalid proxy format. Expected: http://username:password@host:port",
  );

// Media upload schema
export const MediaSchema = z.object({
  media_id: z.string(),
  media_url: z.string().url(),
  media_type: z.enum(["image", "video", "gif"]),
  size: z.number().optional(),
});

export type KaitoApiResponse<T> = z.infer<
  ReturnType<typeof KaitoApiResponseSchema<z.ZodType<T>>>
>;
export type PaginationParams = z.infer<typeof PaginationParamsSchema>;
export type CursorPagination<T> = z.infer<
  ReturnType<typeof CursorPaginationSchema<z.ZodType<T>>>
>;
export type UrlEntity = z.infer<typeof UrlEntitySchema>;
export type Entities = z.infer<typeof EntitiesSchema>;
export type ProfileBio = z.infer<typeof ProfileBioSchema>;
export type Media = z.infer<typeof MediaSchema>;
