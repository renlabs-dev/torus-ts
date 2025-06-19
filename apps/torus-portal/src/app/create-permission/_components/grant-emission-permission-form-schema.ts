import { z } from "zod";
import type { UseFormReturn } from "react-hook-form";
import { SS58_SCHEMA } from "@torus-network/sdk";

const validatePositiveNumber = (value: string) => {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
};

const validateWeight = (value: string) => {
  const num = parseInt(value);
  return !isNaN(num) && num >= 0 && num <= 65535; // u16 range
};

// Schema for allocation types
export const allocationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("FixedAmount"),
    amount: z
      .string()
      .min(1, "Amount is required")
      .refine(validatePositiveNumber, "Must be a positive number"),
  }),
  z.object({
    type: z.literal("Streams"),
    streams: z
      .array(
        z.object({
          streamId: z
            .string()
            .min(1, "Stream ID is required")
            .regex(/^0x[a-fA-F0-9]{64}$/, "Must be a valid 32-byte hex hash"),
          percentage: z
            .string()
            .min(1, "Percentage is required")
            .refine((val) => {
              const num = parseFloat(val);
              return !isNaN(num) && num >= 0 && num <= 100;
            }, "Must be between 0 and 100"),
        }),
      )
      .min(1, "At least one stream is required")
      .refine((streams) => {
        const total = streams.reduce((sum, stream) => {
          const percentage = parseFloat(stream.percentage || "0");
          return sum + (isNaN(percentage) ? 0 : percentage);
        }, 0);
        return total <= 100;
      }, "Total percentage across all streams cannot exceed 100%"),
  }),
]);

// Schema for distribution control
export const distributionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("Manual"),
  }),
  z.object({
    type: z.literal("Automatic"),
    threshold: z
      .string()
      .min(1, "Threshold is required")
      .refine(validatePositiveNumber, "Must be a positive number"),
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
]);

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

// Schema for enforcement authority
export const enforcementSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("None"),
  }),
  z.object({
    type: z.literal("ControlledBy"),
    controllers: z
      .array(SS58_SCHEMA)
      .min(1, "At least one controller is required"),
    requiredVotes: z
      .string()
      .min(1, "Required votes is required")
      .refine((val) => {
        const num = parseInt(val);
        return !isNaN(num) && num > 0;
      }, "Must be a positive integer"),
  }),
]);

// Main form schema
export const grantEmissionPermissionSchema = z.object({
  grantee: SS58_SCHEMA,
  allocation: allocationSchema,
  targets: z
    .array(
      z.object({
        account: SS58_SCHEMA,
        weight: z
          .string()
          .min(1, "Weight is required")
          .refine(validateWeight, "Must be between 0 and 65535"),
      }),
    )
    .min(1, "At least one target is required"),
  distribution: distributionSchema,
  duration: durationSchema,
  revocation: revocationSchema,
  enforcement: enforcementSchema,
});

export type GrantEmissionPermissionFormData = z.infer<
  typeof grantEmissionPermissionSchema
>;

export interface GrantEmissionPermissionMutation {
  isPending: boolean;
  mutate: (data: GrantEmissionPermissionFormData) => void;
}

export type GrantEmissionPermissionForm =
  UseFormReturn<GrantEmissionPermissionFormData>;
