import { z } from 'zod';


// System digest schema - based on SpRuntimeDigest
export const DIGEST_SCHEMA = z.object({
  logs: z.array(z.object({
    // Digest logs can have different variants
    PreRuntime: z.tuple([z.array(z.number()), z.array(z.number())]).optional(),
    Consensus: z.tuple([z.array(z.number()), z.array(z.number())]).optional(),
    Seal: z.tuple([z.array(z.number()), z.array(z.number())]).optional(),
    Other: z.array(z.number()).optional(),
    RuntimeEnvironmentUpdated: z.null().optional(),
  })).optional(),
});