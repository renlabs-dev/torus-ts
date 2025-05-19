import { isSS58 } from "@torus-network/sdk";
import { z } from "zod";

export type FaucetFormValues = z.infer<
  ReturnType<typeof createFaucetFormSchema>
>;

export const createFaucetFormSchema = () =>
  z.object({
    receiver: z
      .string()
      .trim()
      .nonempty({ message: "Recipient address is required" })
      .refine(isSS58, { message: "Invalid recipient address" }),
    requester: z
      .string()
      .trim()
      .nonempty({ message: "Requester address is required" })
      .refine(isSS58, { message: "Invalid requester address" }),
  });
