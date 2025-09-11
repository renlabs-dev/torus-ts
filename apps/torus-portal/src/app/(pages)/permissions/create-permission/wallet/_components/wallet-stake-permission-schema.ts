import { SS58_SCHEMA } from "@torus-network/sdk/types";
import { z } from "zod";

export const WALLET_STAKE_PERMISSION_SCHEMA = z
  .object({
    recipient: SS58_SCHEMA,
    canTransferStake: z.boolean().default(false),
    exclusiveStakeAccess: z.boolean().default(false),
    duration: z.enum(["indefinite", "until_block"]),
    untilBlock: z.coerce
      .number()
      .int()
      .positive("Block number must be positive")
      .optional(),
    revocation: z.enum([
      "irrevocable",
      "revocable_by_delegator",
      "revocable_after",
    ]),
    revocableAfterBlock: z.coerce
      .number()
      .int()
      .positive("Block number must be positive")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.duration === "until_block") {
        return data.untilBlock && data.untilBlock > 0;
      }
      return true;
    },
    {
      message: "Block number is required when duration is 'Until Block'",
      path: ["untilBlock"],
    },
  )
  .refine(
    (data) => {
      if (data.revocation === "revocable_after") {
        return data.revocableAfterBlock && data.revocableAfterBlock > 0;
      }
      return true;
    },
    {
      message: "Block number is required when revocation is 'Revocable After'",
      path: ["revocableAfterBlock"],
    },
  );
