import { z } from "zod";

import {
  AGENT_SHORT_DESCRIPTION_MAX_LENGTH,
  agentNameField,
} from "@torus-network/sdk";

export const REGISTER_AGENT_SCHEMA = z.object({
  agentKey: z.string().min(1, "Agent address is required"),
  agentApiUrl: z.string().optional(),
  name: agentNameField(),
  shortDescription: z
    .string()
    .min(1, "Short description is required")
    .max(
      AGENT_SHORT_DESCRIPTION_MAX_LENGTH,
      `Max ${AGENT_SHORT_DESCRIPTION_MAX_LENGTH} characters`,
    ),
  body: z
    .string()
    .max(3_000, "Agent description must be less than 3,000 characters")
    .optional(),
  twitter: z.string().optional(),
  github: z.string().optional(),
  telegram: z.string().optional(),
  discord: z.string().optional(),
  website: z.string().optional(),
  icon: z.instanceof(File).optional(),
});

export type RegisterAgentFormData = z.infer<typeof REGISTER_AGENT_SCHEMA>;