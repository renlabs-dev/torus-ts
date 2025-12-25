import { qualityTagValues } from "@torus-ts/db/schema";
import { z } from "zod";

export const PROSPECT_SUBMIT_SCHEMA = z.object({
  xHandle: z
    .string()
    .min(1, "X handle is required")
    .max(256, "X handle cannot exceed 256 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Invalid X handle format"),
});

export const PROSPECT_ID_SCHEMA = z.object({
  prospectId: z.string().uuid("Invalid prospect ID"),
});

export const QUALITY_TAG_UPDATE_SCHEMA = z.object({
  prospectId: z.string().uuid("Invalid prospect ID"),
  qualityTag: z.enum(
    Object.keys(qualityTagValues) as [
      keyof typeof qualityTagValues,
      ...(keyof typeof qualityTagValues)[],
    ],
    { errorMap: () => ({ message: "Invalid quality tag" }) },
  ),
});

export const CONVERSION_MARK_SCHEMA = z.object({
  prospectId: z.string().uuid("Invalid prospect ID"),
  details: z.record(z.unknown()).optional(),
});

export const FAILURE_MARK_SCHEMA = z.object({
  prospectId: z.string().uuid("Invalid prospect ID"),
  details: z.record(z.unknown()).optional(),
});

export const LIST_PROSPECTS_SCHEMA = z.object({
  approvalStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  claimStatus: z
    .enum(["UNCLAIMED", "CLAIMED", "FAILED", "CONVERTED"])
    .optional(),
  qualityTag: z
    .enum([
      "UNRATED",
      "HIGH_POTENTIAL",
      "MID_POTENTIAL",
      "LOW_POTENTIAL",
      "BAD_PROSPECT",
    ])
    .optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
});
