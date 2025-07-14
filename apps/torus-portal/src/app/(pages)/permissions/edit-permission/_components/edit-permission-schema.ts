import { z } from "zod";

// Permission selection schema
export const PERMISSION_SELECTION_SCHEMA = z.object({
  permissionId: z.string().min(1, "Permission ID is required"),
});

// Stream schema
export const STREAM_SCHEMA = z.object({
  id: z.string().optional(),
  agent: z.string().min(1, "Agent address is required"),
  percentage: z.number().min(0).max(10000),
});

// Target schema
export const TARGET_SCHEMA = z.object({
  id: z.string().optional(),
  agent: z.string().min(1, "Agent address is required"),
  weight: z.number().min(1, "Weight must be at least 1"),
});

// Distribution control schema
export const DISTRIBUTION_CONTROL_SCHEMA = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("Manual"),
  }),
  z.object({
    type: z.literal("Automatic"),
  }),
  z.object({
    type: z.literal("AtBlock"),
    blockNumber: z.number().min(1, "Block number must be positive"),
  }),
  z.object({
    type: z.literal("Interval"),
    blockNumber: z.number().min(1, "Block number must be positive"),
    blockInterval: z.number().min(1, "Block interval must be positive"),
  }),
]);

// Main edit permission schema
export const EDIT_PERMISSION_SCHEMA = z.object({
  selectedPermission: z.object({
    permissionId: z.string().min(1, "Permission ID is required"),
  }),
  newTargets: z.array(TARGET_SCHEMA).optional(),
  newStreams: z.array(STREAM_SCHEMA).optional(),
  newDistributionControl: DISTRIBUTION_CONTROL_SCHEMA.optional(),
});

// Type exports
export type PermissionSelectionFormData = z.infer<
  typeof PERMISSION_SELECTION_SCHEMA
>;
export type StreamFormData = z.infer<typeof STREAM_SCHEMA>;
export type TargetFormData = z.infer<typeof TARGET_SCHEMA>;
export type DistributionControlFormData = z.infer<
  typeof DISTRIBUTION_CONTROL_SCHEMA
>;
export type EditPermissionFormData = z.infer<typeof EDIT_PERMISSION_SCHEMA>;

// Permission info type for display
export interface PermissionInfo {
  permissionId: string;
  grantorAddress: string;
  recipientAddress: string;
  currentTargets?: TargetFormData[];
  currentStreams?: StreamFormData[];
  currentDistribution?:
    | { type: "Manual" }
    | { type: "Automatic"; threshold: string }
    | { type: "AtBlock"; blockNumber: string }
    | { type: "Interval"; blocks: string }
    | null;
  canEditTargets: boolean;
  canEditStreams: boolean;
  canEditDistribution: boolean;
  editUntilBlock?: bigint;
}
