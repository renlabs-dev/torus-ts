import { z } from "zod";

export const TARGET_SCHEMA = z.object({
  address: z.string().min(1, "Agent address is required"),
  weight: z.number().min(1, "Weight must be at least 1"),
});

export const STREAM_ENTRY_SCHEMA = z.object({
  streamId: z
    .string()
    .min(1, "Stream ID is required")
    .regex(
      /^0x[0-9a-fA-F]{64}$/,
      "Stream ID must be a valid hex string (0x...)",
    ),
  percentage: z.number().min(0).max(100),
});

export const DISTRIBUTION_CONTROL_SCHEMA = z.union([
  z.object({ Manual: z.null() }),
  z.object({ Automatic: z.bigint().nonnegative() }),
  z.object({ AtBlock: z.number().int().nonnegative() }),
  z.object({ Interval: z.number().int().nonnegative() }),
]);

export const EDIT_PERMISSION_SCHEMA = z.object({
  permissionId: z
    .string()
    .min(1, "Permission ID is required")
    .regex(
      /^0x[0-9a-fA-F]{64}$/,
      "Permission ID must be a valid hex string (0x...)",
    ),
  newTargets: z.array(TARGET_SCHEMA).optional(),
  newStreams: z.array(STREAM_ENTRY_SCHEMA).optional(),
  newDistributionControl: DISTRIBUTION_CONTROL_SCHEMA.optional(),
});

export type DistributionControlFormData = z.infer<
  typeof DISTRIBUTION_CONTROL_SCHEMA
>;
export type EditPermissionFormData = z.infer<typeof EDIT_PERMISSION_SCHEMA>;
