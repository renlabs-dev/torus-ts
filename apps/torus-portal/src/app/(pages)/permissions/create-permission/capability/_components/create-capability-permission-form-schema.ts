import { z } from "zod";
import type { UseFormReturn } from "react-hook-form";
import { SS58_SCHEMA } from "@torus-network/sdk";

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
    type: z.literal("RevocableByGrantor"),
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
  grantee: SS58_SCHEMA,
  namespacePath: z.string().min(1, "Namespace path is required"),
  duration: durationSchema,
  revocation: revocationSchema,
});

export type CreateCapabilityPermissionFormData = z.infer<
  typeof createCapabilityPermissionSchema
>;

export interface CreateCapabilityPermissionMutation {
  isPending: boolean;
  mutate: (data: CreateCapabilityPermissionFormData) => void;
}

export type CreateCapabilityPermissionForm =
  UseFormReturn<CreateCapabilityPermissionFormData>;
