import type { UseFormReturn } from "react-hook-form";
import { z } from "zod";

import { SS58_SCHEMA } from "@torus-network/sdk";

import {
  createStreamPercentageValidator,
  createTargetWeightValidator,
} from "~/utils/percentage-validation";

// Permission selection schema
export const permissionSelectionSchema = z.object({
  permissionId: z.string().min(1, "Please select a permission to edit"),
});

// Edit form schema - all fields are optional since user might only want to edit specific parts
export const editEmissionPermissionSchema = z.object({
  // Permission selection
  selectedPermission: z.object({
    permissionId: z.string(),
  }),

  // Updated targets
  newTargets: z
    .array(
      z.object({
        account: SS58_SCHEMA,
        weight: z
          .string()
          .min(1, "Required")
          .refine((val) => {
            const num = parseFloat(val);
            return !isNaN(num) && num >= 0 && num <= 100;
          }, "Must be between 0 and 100"),
      }),
    )
    .min(1, "At least one target is required")
    .superRefine(createTargetWeightValidator()),

  // Updated streams
  newStreams: z
    .array(
      z.object({
        streamId: z
          .string()
          .min(1, "Stream ID is required")
          .regex(/^0x[a-fA-F0-9]{64}$/, "Must be a valid 32-byte hex hash"),
        percentage: z
          .string()
          .min(1, "Required")
          .refine((val) => {
            const num = parseFloat(val);
            return !isNaN(num) && num >= 0 && num <= 100;
          }, "Must be between 0 and 100"),
      }),
    )
    .optional()
    .superRefine((streams, ctx) => {
      if (!streams || streams.length === 0) return;
      createStreamPercentageValidator()(streams, ctx);
    }),

  // Updated distribution control
  newDistributionControl: z
    .discriminatedUnion("type", [
      z.object({
        type: z.literal("Manual"),
      }),
      z.object({
        type: z.literal("Automatic"),
        threshold: z
          .string()
          .min(1, "Threshold is required")
          .refine((val) => {
            const num = parseFloat(val);
            return !isNaN(num) && num > 0;
          }, "Must be a positive number"),
      }),
      z.object({
        type: z.literal("AtBlock"),
        blockNumber: z
          .string()
          .min(1, "Block number is required")
          .refine((val) => {
            const num = parseInt(val);
            return !isNaN(num) && num > 0;
          }, "Must be a positive integer"),
      }),
      z.object({
        type: z.literal("Interval"),
        blocks: z
          .string()
          .min(1, "Block interval is required")
          .refine((val) => {
            const num = parseInt(val);
            return !isNaN(num) && num > 0;
          }, "Must be a positive integer"),
      }),
    ])
    .optional(),
});

export type PermissionSelectionFormData = z.infer<
  typeof permissionSelectionSchema
>;
export type EditEmissionPermissionFormData = z.infer<
  typeof editEmissionPermissionSchema
>;

export interface EditEmissionPermissionMutation {
  isPending: boolean;
  mutate: (data: EditEmissionPermissionFormData) => void;
}

export type EditEmissionPermissionForm =
  UseFormReturn<EditEmissionPermissionFormData>;

// Permission info for display
export interface PermissionInfo {
  permissionId: string;
  delegator: string;
  recipient: string;
  userRole: "delegator" | "recipient";  
  canEditStreams: boolean;
  canEditDistribution: boolean;
  currentTargets: { account: string; weight: string }[];
  currentStreams: { streamId: string; percentage: string }[] | null;
  currentDistribution:
    | { type: "Manual" }
    | { type: "Automatic"; threshold: string }
    | { type: "AtBlock"; blockNumber: string }
    | { type: "Interval"; blocks: string }
    | null;
}
