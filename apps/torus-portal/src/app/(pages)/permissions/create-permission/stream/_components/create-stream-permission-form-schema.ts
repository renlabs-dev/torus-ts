import { SS58_SCHEMA } from "@torus-network/sdk/types";
import { createRecipientWeightValidator } from "~/utils/percentage-validation";
import type { UseFormReturn } from "react-hook-form";
import { z } from "zod";

const validatePositiveNumber = (value: string) => {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
};

const allocationSchema = z.discriminatedUnion("type", [
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
            .min(1, "Required")
            .refine((val) => {
              const num = parseFloat(val);
              return !isNaN(num) && num >= 0 && num <= 100;
            }, "Must be between 0 and 100"),
        }),
      )
      .min(1, "At least one stream is required"),
  }),
]);

const distributionSchema = z.discriminatedUnion("type", [
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

const durationSchema = z.discriminatedUnion("type", [
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

const revocationSchema = z.discriminatedUnion("type", [
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

const enforcementSchema = z.discriminatedUnion("type", [
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

export const createStreamPermissionSchema = z.object({
  allocation: allocationSchema,
  recipients: z
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
    .min(1, "At least one recipient is required")
    .superRefine(createRecipientWeightValidator()),
  distribution: distributionSchema,
  duration: durationSchema,
  revocation: revocationSchema,
  enforcement: enforcementSchema,
  // Optional fields for enhanced stream management
  recipientManager: SS58_SCHEMA.optional(),
  weightSetter: SS58_SCHEMA.optional(),
});

export type CreateStreamPermissionFormData = z.infer<
  typeof createStreamPermissionSchema
>;

export type CreateStreamPermissionForm =
  UseFormReturn<CreateStreamPermissionFormData>;
