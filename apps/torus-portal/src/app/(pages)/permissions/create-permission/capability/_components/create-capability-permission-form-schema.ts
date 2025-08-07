import type { UseFormReturn } from "react-hook-form";
import { z } from "zod";

import { SS58_SCHEMA } from "@torus-network/sdk/types";

// Schema for duration
export const durationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("Indefinite"),
  }),
  z.object({
    type: z.literal("UntilBlock"),
    blockNumber: z
      .string()
      .min(1, "Block number is required")
      .refine((val) => {
        const num = parseInt(val);
        return !isNaN(num) && num > 0;
      }, "Must be a positive integer"),
  }),
]);

// Schema for revocation terms
export const revocationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("Irrevocable"),
  }),
  z.object({
    type: z.literal("RevocableByDelegator"),
  }),
  z.object({
    type: z.literal("RevocableByArbiters"),
    accounts: z.array(SS58_SCHEMA).min(1, "At least one arbiter is required"),
    requiredVotes: z
      .string()
      .min(1, "Required votes is required")
      .refine((val) => {
        const num = parseInt(val);
        return !isNaN(num) && num > 0;
      }, "Must be a positive integer"),
  }),
  z.object({
    type: z.literal("RevocableAfter"),
    blockNumber: z
      .string()
      .min(1, "Block number is required")
      .refine((val) => {
        const num = parseInt(val);
        return !isNaN(num) && num > 0;
      }, "Must be a positive integer"),
  }),
]);

// Main form schema
export const createCapabilityPermissionSchema = z.object({
  recipient: SS58_SCHEMA,
  namespacePaths: z
    .array(z.string())
    .min(1, "At least one namespace path is required"),
  duration: durationSchema,
  revocation: revocationSchema,
  instances: z
    .string()
    .min(1, "Number of instances is required")
    .max(100, "Maximum instances is 100")
    .refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && num > 0;
    }, "Must be a positive integer"),
});

export type CreateCapabilityPermissionFormData = z.infer<
  typeof createCapabilityPermissionSchema
>;

export type CreateCapabilityPermissionForm =
  UseFormReturn<CreateCapabilityPermissionFormData>;
