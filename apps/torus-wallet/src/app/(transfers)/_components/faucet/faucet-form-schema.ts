import { isSS58 } from "@torus-network/sdk/types";
import { z } from "zod";

export type FaucetFormValues = z.infer<typeof FaucetFormSchema>;

export const FaucetFormSchema = z.object({
  recipient: z
    .string()
    .trim()
    .min(1, { message: "Recipient address is required" })
    .refine(isSS58, { message: "Invalid recipient address" }),
});
